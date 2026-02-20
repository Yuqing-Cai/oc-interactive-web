export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    if (url.pathname === "/generate" && request.method === "POST") {
      return handleGenerateJson(request, env);
    }

    if (url.pathname === "/generate-stream" && request.method === "POST") {
      return handleGenerateStream(request, env, ctx);
    }

    if (url.pathname === "/generate" || url.pathname === "/generate-stream") {
      return json({ error: "Method Not Allowed" }, 405);
    }

    return json({ error: "Not Found" }, 404);
  },
};

async function handleGenerateJson(request, env) {
  try {
    const body = await request.json();
    const result = await runGeneration(body, env);
    return json({ content: result.content, meta: result.meta }, 200);
  } catch (err) {
    return mapErrorToResponse(err);
  }
}

async function handleGenerateStream(request, env, ctx) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const send = async (payload) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
  };

  const close = async () => {
    try {
      await writer.close();
    } catch {}
  };

  const streamTask = (async () => {
    let body;
    let heartbeat = null;
    try {
      body = await request.json();
    } catch {
      await send({ type: "error", error: "请求体不是有效 JSON。" });
      await close();
      return;
    }

    // 某些链路（代理/CDN）会在长时间无数据时主动断开流连接；发送心跳包保持连接活性。
    heartbeat = setInterval(() => {
      send({ type: "ping", t: Date.now() }).catch(() => {});
    }, 5000);

    try {
      const result = await runGeneration(body, env, {
        onStage: async (stage) => send({ type: "stage", ...stage }),
      });

      await send({
        type: "done",
        content: result.content,
        meta: result.meta,
      });
    } catch (err) {
      const mapped = mapError(err);
      await send({ type: "error", error: mapped.message, code: mapped.code || "GEN_ERROR" });
    } finally {
      if (heartbeat) clearInterval(heartbeat);
      await close();
    }
  })();

  ctx?.waitUntil(streamTask);

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...corsHeaders(),
    },
  });
}

async function runGeneration(body, env, hooks = {}) {
  const { selections = [], model = "MiniMax-M2.5", extraPrompt = "" } = body || {};

  if (!Array.isArray(selections) || selections.length < 3) {
    const e = new Error("At least 3 selections are required.");
    e.status = 400;
    throw e;
  }

  const apiKey = env.OPENAI_API_KEY;
  const apiUrl = env.OPENAI_API_URL || "https://api.minimax.chat/v1/chat/completions";
  if (!apiKey) {
    const e = new Error("OPENAI_API_KEY is missing.");
    e.status = 500;
    throw e;
  }

  const trace = [];
  const startedAt = Date.now();
  const mark = (stage, extra = {}) => {
    const row = { stage, t: Date.now() - startedAt, ...extra };
    trace.push(row);
    if (hooks.onStage) hooks.onStage(row);
  };

  mark("request_received", { selections: selections.length });
  const mode = detectMode(selections);
  mark("mode_decided", { mode });

  const systemPrompt = buildSystemPrompt(mode);
  const userPrompt = buildUserPrompt(selections, extraPrompt, mode);

  const fallbackModel = (env.FALLBACK_MODEL || "").trim();
  let finalModel = model;
  let repaired = false;

  // 单次主生成：直接产出最终结构，避免多阶段链路导致长尾超时。
  const payload = {
    model,
    temperature: 0.62,
    max_tokens: mode === "timeline" ? 3400 : 2700,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "oc_profile",
        strict: true,
        schema: buildOutputSchema(mode),
      },
    },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  const primaryTimeoutMs = Number(env.PRIMARY_TIMEOUT_MS || 85000);
  const fallbackTimeoutMs = Number(env.FALLBACK_TIMEOUT_MS || 70000);

  mark("upstream_request_started", { model });
  let upstream = null;
  let primaryTimeout = false;

  try {
    upstream = await requestWithTransientRetries(apiUrl, apiKey, payload, { timeoutMs: primaryTimeoutMs, retries: 0 });
  } catch (err) {
    if (err?.name === "TimeoutError") {
      primaryTimeout = true;
      mark("upstream_timeout", { model, timeoutMs: primaryTimeoutMs });
    } else {
      throw err;
    }
  }

  const shouldFallback = Boolean(fallbackModel) && (
    primaryTimeout ||
    !upstream ||
    (upstream && !upstream.ok && isRetryableStatus(upstream.status))
  );

  if (shouldFallback) {
    if (upstream && !upstream.ok) {
      mark("upstream_retryable_error", { status: upstream.status, fallbackModel });
    }
    mark("fallback_request_started", { model: fallbackModel, timeoutMs: fallbackTimeoutMs });
    finalModel = fallbackModel;
    upstream = await requestWithTransientRetries(apiUrl, apiKey, { ...payload, model: fallbackModel }, { timeoutMs: fallbackTimeoutMs, retries: 0 });
    mark("fallback_response_received", { status: upstream.status });
  }

  if (!upstream || !upstream.ok) {
    const status = upstream?.status || 504;
    const text = upstream ? await upstream.text() : "no upstream response";
    mark("upstream_error", { status });
    const e = new Error(`Upstream error(${status}): ${text}`);
    e.status = status;
    throw e;
  }

  mark("upstream_response_received");
  const data = await upstream.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  if (!rawContent) {
    const e = new Error("No content in model response.");
    e.status = 502;
    throw e;
  }

  let structured = parseStructuredOutput(rawContent, mode);
  if (!structured.ok) {
    mark("structured_parse_failed", { reason: structured.reason });

    const narrativeObj = tryParseNarrativeOutput(rawContent, mode, null);
    if (narrativeObj) {
      const parsedNarrative = parseStructuredOutput(narrativeObj, mode);
      if (parsedNarrative.ok) {
        structured = parsedNarrative;
        repaired = true;
        mark("structured_narrative_recovered");
      }
    }

    if (!structured.ok) {
      const coerced = await coerceToSchemaJson(apiUrl, apiKey, finalModel, rawContent, mode);
      if (coerced) {
        structured = { ok: true, value: coerced };
        repaired = true;
        mark("structured_parse_recovered");
      } else {
        const e = new Error(`结构化输出校验失败：${structured.reason}`);
        e.status = 502;
        throw e;
      }
    }
  }

  // 只做程序化对齐检查；先字段级本地修复，再考虑一次模型重写。
  mark("alignment_check_started", { round: 1, maxAlignRounds: 2, enableModelAudit: false });
  let issues = checkProgrammaticAlignment(structured.value, selections, extraPrompt);
  if (issues.length) {
    mark("alignment_rule_failed", { round: 1, issues: issues.length });
    mark("alignment_check_failed", { round: 1, issues: issues.length });

    const locallyPatched = repairStructuredFieldsLocally(structured.value, mode, selections);
    const localIssues = checkProgrammaticAlignment(locallyPatched, selections, extraPrompt);
    if (localIssues.length === 0) {
      structured = { ok: true, value: locallyPatched };
      repaired = true;
      issues = [];
      mark("alignment_local_repair_applied", { round: 1 });
    } else {
      mark("alignment_repair_started", { round: 2 });
      const repairedObj = await regenerateWithIssues(apiUrl, apiKey, finalModel, systemPrompt, userPrompt, structured.value, issues, mode);
      if (!repairedObj) {
        mark("alignment_repair_failed", { round: 2 });
        const e = new Error(`生成内容与选轴/补充提示词不一致：${issues.slice(0, 3).join("；") || "请重试"}`);
        e.status = 502;
        throw e;
      }

      structured = { ok: true, value: repairedObj };
      repaired = true;
      mark("alignment_repair_applied", { round: 2 });

      mark("alignment_check_started", { round: 2, maxAlignRounds: 2, enableModelAudit: false });
      issues = checkProgrammaticAlignment(structured.value, selections, extraPrompt);
      if (issues.length) {
        mark("alignment_check_failed", { round: 2, issues: issues.length });
        const e = new Error(`生成内容与选轴/补充提示词不一致：${issues.slice(0, 3).join("；") || "请重试"}`);
        e.status = 502;
        throw e;
      }
    }
  }

  mark("alignment_check_passed", { round: issues.length ? 2 : 1 });

  const finalized = enforceTemplateShape(structured.value, mode, selections);
  const content = renderStructuredMarkdown(finalized, mode);
  mark("completed", { repaired });
  return {
    content,
    meta: {
      mode,
      repaired,
      trace,
      totalMs: Date.now() - startedAt,
      finalModel,
      fallbackUsed: finalModel !== model,
    },
  };
}

function mapError(err) {
  if (err?.name === "TimeoutError") {
    return {
      status: 504,
      code: "UPSTREAM_TIMEOUT",
      message:
        "模型响应超时（已自动重试/降级）。通常是上游拥塞或当前提示较重；请重试。",
    };
  }

  const status = Number(err?.status || 500);
  if (status === 524) {
    return {
      status: 524,
      code: "UPSTREAM_524_TIMEOUT",
      message: "上游模型网关超时（524）。已做自动重试，仍失败。通常是模型端拥塞或生成过长，请稍后重试。",
    };
  }

  return {
    status,
    code: err?.code || "UNEXPECTED_ERROR",
    message: err?.message || "Unexpected error",
  };
}

function mapErrorToResponse(err) {
  const mapped = mapError(err);
  return json({ error: mapped.message, code: mapped.code }, mapped.status);
}

function detectMode(selections) {
  const axes = new Set(selections.map((s) => String(s.axis || "").trim().toUpperCase()));
  return axes.has("F") || axes.has("X") || axes.has("T") || axes.has("G") ? "timeline" : "opening";
}

function buildSystemPrompt(mode) {
  return [
    "你是‘OC男主设定总设计师’。",
    "你必须只返回符合 JSON Schema 的对象，不得输出 markdown、解释、代码块或任何额外文本。",
    "目标是高质量设定，但输出载体必须是结构化字段，不要自行输出编号标题。",
    "同一组选项可能对应多种实现，这里只给一种高完成度实现。",
    "硬约束：MC 不得命名；男主档案必须详细、连续叙述且包含过去→现在成因链。",
    "硬约束：无论 B 轴如何，male_profile.profile_body 都要完整详尽，禁止简历式条目堆砌。",
    "硬约束：MBTI、九型人格、副型必须填写且自洽。",
    "映射规则：根据已选轴做中度映射，不能反向违背。",
    `当前模式：${mode}`,
  ].join("\n");
}

function buildUserPrompt(selections, extraPrompt, mode) {
  return [
    `请基于以下已选轴要素，生成‘高完成度单版本男主设定’（模式：${mode === "timeline" ? "完整时间线骨架" : "开场静态"}）：`,
    selections
      .map((s) => {
        const long = String(s.longDetail || "").trim().slice(0, 180);
        const detail = String(s.detail || "").trim().slice(0, 80);
        const chunks = [`- ${s.axis}: ${s.option}`];
        if (detail) chunks.push(`短释义：${detail}`);
        if (long) chunks.push(`扩展说明：${long}`);
        return chunks.join("｜");
      })
      .join("\n"),
    extraPrompt ? `\n补充提示词/约束：${String(extraPrompt).slice(0, 320)}` : "",
  ].join("\n");
}







function repairStructuredFieldsLocally(obj, mode, selections = []) {
  const safe = JSON.parse(JSON.stringify(obj || {}));
  const scrubName = (s) => String(s || "").replace(/(她叫|名叫|名字是|MC叫|女主叫)[^，。；\n]*/g, "她");

  safe.overview = scrubName(safe.overview || "");
  safe.world_slice = scrubName(safe.world_slice || "");
  safe.mc_intel = scrubName(safe.mc_intel || "");
  safe.relationship_dynamics = scrubName(safe.relationship_dynamics || "");
  safe.opening_scene = scrubName(safe.opening_scene || "");

  safe.male_profile = safe.male_profile || {};
  safe.male_profile.profile_body = scrubName(String(safe.male_profile.profile_body || ""));

  if (safe.male_profile.profile_body.length < 520) {
    const extra = [safe.overview, safe.world_slice, safe.relationship_dynamics].filter(Boolean).join("\n");
    safe.male_profile.profile_body = `${safe.male_profile.profile_body}\n\n${extra}`.trim();
  }

  if (!Array.isArray(safe.axis_mapping)) safe.axis_mapping = [];
  safe.axis_mapping = safe.axis_mapping.map((x) => String(x || "").trim()).filter(Boolean);
  if (safe.axis_mapping.length < 4) {
    const fills = (Array.isArray(selections) ? selections : []).map((s) => `围绕${s.axis}轴（${s.option}）做中度映射，避免反向偏离。`);
    for (const row of fills) {
      if (safe.axis_mapping.length >= 4) break;
      safe.axis_mapping.push(row);
    }
  }

  safe.tradeoff_notes = String(safe.tradeoff_notes || "").trim() || "当前版本优先保证设定一致性，细节风格可在重生成中微调。";
  safe.regen_suggestion = String(safe.regen_suggestion || "").trim() || "如需更强冲突，可提高关系拉扯与现实代价密度。";

  if (mode === "timeline") {
    safe.timeline = String(safe.timeline || "").trim() || "第一幕建立关系动力，第二幕失衡加剧，第三幕代价兑现与关系重构。";
    safe.ending_payoff = String(safe.ending_payoff || "").trim() || "终局与已选终局轴保持同向兑现，给出代价与情感回收。";
  }

  return safe;
}

function checkProgrammaticAlignment(obj, selections, extraPrompt = "") {
  const issues = [];
  const textFields = [
    obj?.overview,
    obj?.male_profile?.profile_body,
    obj?.world_slice,
    obj?.mc_intel,
    obj?.relationship_dynamics,
    obj?.timeline,
    obj?.ending_payoff,
    obj?.tradeoff_notes,
    obj?.regen_suggestion,
    obj?.opening_scene,
    ...(Array.isArray(obj?.axis_mapping) ? obj.axis_mapping : []),
  ].map((x) => String(x || "")).join("\n");

  if (/(她叫|名叫|名字是|MC叫|女主叫)/.test(textFields)) issues.push("疑似给MC命名或显式命名描述");
  if (String(obj?.male_profile?.profile_body || "").length < 520) issues.push("男主背景档案不够详细");

  const list = Array.isArray(selections) ? selections : [];
  const axisHits = list.filter((s) => {
    const keywords = [String(s?.option || ""), String(s?.detail || "")]
      .flatMap((x) => x.split(/[（）、，。\s\-:：|]+/))
      .map((x) => x.trim())
      .filter((x) => x.length >= 2)
      .slice(0, 6);
    return keywords.some((k) => textFields.includes(k));
  }).length;

  // 中等强度映射：不能无视选轴（太弱），也不能堆砌选项原文（太强/缝合感）
  if (list.length >= 3 && axisHits < 2) issues.push("文本与选轴显式关联过弱，疑似未跟随选项");

  const stitchedCount = list.reduce((n, s) => {
    const raw = String(s?.option || "").trim();
    if (!raw) return n;
    return n + (textFields.split(raw).length - 1);
  }, 0);
  if (stitchedCount > Math.max(4, list.length + 1)) issues.push("选项原文重复堆砌过多，映射强度过高（疑似缝合）");

  if (extraPrompt && extraPrompt.length >= 4) {
    const promptTokens = extraPrompt
      .split(/[，。；;、\n\s]+/)
      .map((x) => x.trim())
      .filter((x) => x.length >= 2)
      .slice(0, 8);
    if (promptTokens.length) {
      const hit = promptTokens.some((t) => textFields.includes(t));
      if (!hit) issues.push("补充提示词未被明显落实");
    }
  }

  return issues;
}


function buildOutputSchema(mode) {
  const timelineProps = mode === "timeline"
    ? {
        timeline: { type: "string", minLength: 200 },
        ending_payoff: { type: "string", minLength: 120 },
      }
    : {};

  const timelineReq = mode === "timeline" ? ["timeline", "ending_payoff"] : [];

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      overview: { type: "string", minLength: 120 },
      male_profile: {
        type: "object",
        additionalProperties: false,
        properties: {
          mbti: { type: "string", pattern: "^[EI][NS][FT][JP]$" },
          enneagram: { type: "string", minLength: 2 },
          instinctual_variant: { type: "string", pattern: "^(sp|sx|so)\\/(sp|sx|so)$" },
          profile_body: { type: "string", minLength: mode === "timeline" ? 700 : 550 },
        },
        required: ["mbti", "enneagram", "instinctual_variant", "profile_body"],
      },
      world_slice: { type: "string", minLength: 120 },
      mc_intel: { type: "string", minLength: 100 },
      relationship_dynamics: { type: "string", minLength: 100 },
      axis_mapping: {
        type: "array",
        minItems: 4,
        maxItems: 8,
        items: { type: "string", minLength: 8 },
      },
      tradeoff_notes: { type: "string", minLength: 20 },
      regen_suggestion: { type: "string", minLength: 10 },
      opening_scene: { type: "string", minLength: mode === "timeline" ? 250 : 300 },
      ...timelineProps,
    },
    required: [
      "overview",
      "male_profile",
      "world_slice",
      "mc_intel",
      "relationship_dynamics",
      "axis_mapping",
      "tradeoff_notes",
      "regen_suggestion",
      "opening_scene",
      ...timelineReq,
    ],
  };
}

function parseStructuredOutput(raw, mode) {
  const normalized = normalizeJsonLikeContent(raw);
  let obj = null;

  try {
    obj = typeof normalized === "string" ? JSON.parse(normalized) : normalized;
  } catch {
    return { ok: false, reason: "JSON 解析失败" };
  }

  if (!obj || typeof obj !== "object") return { ok: false, reason: "响应不是对象" };

  const profile = obj.male_profile || obj.character_profile || obj.hero_profile || obj.profile || {};
  obj.male_profile = {
    ...(typeof profile === "object" ? profile : {}),
    mbti: profile.mbti || profile.MBTI || obj.mbti,
    enneagram: profile.enneagram || profile["九型人格"] || obj.enneagram,
    instinctual_variant: profile.instinctual_variant || profile.instinct || profile["副型"] || obj.instinctual_variant,
    profile_body: profile.profile_body || profile.background || obj.profile_body,
  };

  if (!obj.male_profile || typeof obj.male_profile !== "object") return { ok: false, reason: "缺少 male_profile" };

  const mergedProfileText = [
    obj.male_profile.mbti,
    obj.male_profile.instinctual_variant,
    obj.male_profile.profile_body,
    raw,
  ].map((x) => String(x || "")).join("\n");

  const mbti = normalizeMbti(obj.male_profile.mbti) || extractMbtiFromText(mergedProfileText);
  if (!mbti) return { ok: false, reason: "MBTI 非法" };
  obj.male_profile.mbti = mbti;

  if (!String(obj.male_profile.enneagram || "").trim()) return { ok: false, reason: "缺少九型人格" };

  const iv = normalizeInstinctVariant(obj.male_profile.instinctual_variant) || extractInstinctFromText(mergedProfileText);
  if (!iv) return { ok: false, reason: "副型非法" };
  obj.male_profile.instinctual_variant = iv;

  const requiredTextFields = [
    ["overview", 80],
    ["world_slice", 80],
    ["mc_intel", 60],
    ["relationship_dynamics", 60],
    ["tradeoff_notes", 10],
    ["regen_suggestion", 8],
    ["opening_scene", 120],
  ];

  for (const [key, minLen] of requiredTextFields) {
    obj[key] = normalizeTextField(obj[key]);
    if (obj[key].length < minLen) {
      return { ok: false, reason: `${key} 字段无效` };
    }
  }

  obj.male_profile.profile_body = normalizeTextField(obj.male_profile.profile_body);
  if (obj.male_profile.profile_body.length < 300) {
    return { ok: false, reason: "profile_body 字段无效" };
  }

  if (!Array.isArray(obj.axis_mapping)) return { ok: false, reason: "axis_mapping 字段无效" };
  obj.axis_mapping = obj.axis_mapping.map((x) => normalizeTextField(x)).filter(Boolean);
  if (obj.axis_mapping.length < 3) return { ok: false, reason: "axis_mapping 字段无效" };

  if (mode === "timeline") {
    obj.timeline = normalizeTextField(obj.timeline);
    obj.ending_payoff = normalizeTextField(obj.ending_payoff);
    if (obj.timeline.length < 100) return { ok: false, reason: "timeline 字段无效" };
    if (obj.ending_payoff.length < 60) return { ok: false, reason: "ending_payoff 字段无效" };
  }

  return { ok: true, value: obj };
}

function tryParseNarrativeOutput(raw, mode, plan) {
  const text = String(raw || "");
  if (!text.trim()) return null;
  if (!/1\)\s*设定总览/.test(text)) return null;

  const pick = (n, next) => {
    const re = new RegExp(`${n}\\)\\s*[\\s\\S]*?\\n([\\s\\S]*?)${next ? `\\n${next}\\)` : "$"}`);
    const m = text.match(re);
    return (m?.[1] || "").trim();
  };

  const overview = pick(1, 2);
  const profile = pick(2, 3);
  const world = pick(3, 4);
  const mcIntel = pick(4, 5);
  const relation = pick(5, 6);
  const mappingBlock = mode === "timeline" ? pick(8, 9) : pick(6, 7);
  const tradeoff = mode === "timeline" ? pick(9, 10) : pick(7, 8);
  const regen = mode === "timeline" ? pick(10, 11) : pick(8, 9);
  const opening = mode === "timeline" ? pick(11, null) : pick(9, null);
  const timeline = mode === "timeline" ? pick(6, 7) : "";
  const ending = mode === "timeline" ? pick(7, 8) : "";

  const mbti = normalizeMbti(profile.match(/MBTI\s*[：:]\s*([A-Za-z]{4})/i)?.[1] || plan?.male_profile?.mbti);
  const enneagram = profile.match(/九型人格\s*[：:]\s*([^\n]+)/)?.[1]?.trim() || plan?.male_profile?.enneagram || "5w4";
  const instinct = normalizeInstinctVariant(profile.match(/副型\s*[：:]\s*([^\n]+)/)?.[1] || plan?.male_profile?.instinctual_variant);
  const profileBody = profile.replace(/MBTI\s*[：:].*$/gim, "").replace(/九型人格\s*[：:].*$/gim, "").replace(/副型\s*[：:].*$/gim, "").trim();

  const axisMapping = mappingBlock
    .split("\n")
    .map((x) => x.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  return {
    overview,
    male_profile: {
      mbti: mbti || "INTJ",
      enneagram,
      instinctual_variant: instinct || "sp/sx",
      profile_body: profileBody,
    },
    world_slice: world,
    mc_intel: mcIntel,
    relationship_dynamics: relation,
    axis_mapping: axisMapping,
    tradeoff_notes: tradeoff,
    regen_suggestion: regen,
    opening_scene: opening,
    ...(mode === "timeline" ? { timeline, ending_payoff: ending } : {}),
  };
}

function normalizeTextField(value) {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((x) => normalizeTextField(x)).filter(Boolean).join("\n").trim();
  if (typeof value === "object") {
    const preferred = [value.text, value.content, value.value, value.description].map((x) => normalizeTextField(x)).find(Boolean);
    if (preferred) return preferred;
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return "";
}

function normalizeMbti(value) {
  const text = String(value || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (/^[EI][NS][FT][JP]$/.test(text)) return text;
  const m = text.match(/[EI][NS][FT][JP]/);
  return m ? m[0] : "";
}

function extractMbtiFromText(text) {
  const src = String(text || "").toUpperCase();
  const direct = src.match(/\b([EI][NS][FT][JP])(?:[-_/ ]?[AT])?\b/);
  if (direct) return direct[1];
  const fuzzy = src.replace(/[^A-Z]/g, "").match(/[EI][NS][FT][JP]/);
  return fuzzy ? fuzzy[0] : "";
}

function normalizeInstinctVariant(value) {
  const text = String(value || "").toLowerCase().trim();
  if (!text) return "";

  const canonical = text
    .replace(/\s+/g, "")
    .replace(/[—–-]+/g, "/")
    .replace(/自保/g, "sp")
    .replace(/亲密|一对一/g, "sx")
    .replace(/社交/g, "so")
    .replace(/型|副型|本能/g, "");

  if (/^(sp|sx|so)\/(sp|sx|so)$/.test(canonical)) return canonical;
  if (/^(sp|sx|so)(sp|sx|so)$/.test(canonical)) return `${canonical.slice(0,2)}/${canonical.slice(2,4)}`;
  if (/^(sp|sx|so)$/.test(canonical)) return `${canonical}/sx`;

  const found = canonical.match(/sp|sx|so/g) || [];
  if (found.length >= 2) return `${found[0]}/${found[1]}`;
  if (found.length === 1) return `${found[0]}/sx`;
  return "";
}

function extractInstinctFromText(text) {
  const src = String(text || "").toLowerCase();
  const mapped = src
    .replace(/自保/g, "sp")
    .replace(/亲密|一对一/g, "sx")
    .replace(/社交/g, "so");
  const direct = mapped.match(/\b(sp|sx|so)\s*[\/｜|,， ]\s*(sp|sx|so)\b/);
  if (direct) return `${direct[1]}/${direct[2]}`;
  const found = mapped.match(/\bsp\b|\bsx\b|\bso\b/g) || [];
  if (found.length >= 2) return `${found[0]}/${found[1]}`;
  if (found.length === 1) return `${found[0]}/sx`;
  return "";
}

function normalizeJsonLikeContent(raw) {
  if (raw == null) return "";

  // 兼容部分模型返回 content 数组块（text segments）
  if (Array.isArray(raw)) {
    const joined = raw
      .map((x) => (typeof x === "string" ? x : (x?.text || x?.content || "")))
      .join("");
    return normalizeJsonLikeContent(joined);
  }

  if (typeof raw !== "string") return raw;

  let text = raw.trim();
  if (!text) return text;

  // 去掉 markdown 代码块包裹
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) text = fence[1].trim();

  // 若前后有解释文本，截取首个 JSON 对象
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  return text;
}



async function coerceToSchemaJson(apiUrl, apiKey, model, rawContent, mode) {
  const prompt = [
    "你是JSON修复器。把输入内容修复/转换成严格符合给定JSON Schema的对象。",
    "仅输出JSON对象，不要解释，不要markdown。",
    "若输入是散文，请提取其中可用信息并补全为自洽对象。",
    "输入内容：",
    typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent),
  ].join("\n");

  const res = await fetchWithTimeout(
    apiUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: mode === "timeline" ? 3800 : 2800,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "oc_profile",
            strict: true,
            schema: buildOutputSchema(mode),
          },
        },
        messages: [
          { role: "system", content: "你是严格JSON修复器，仅输出合法JSON。" },
          { role: "user", content: prompt },
        ],
      }),
    },
    30000
  );

  if (!res.ok) return null;
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  const parsed = parseStructuredOutput(raw, mode);
  return parsed.ok ? parsed.value : null;
}


async function regenerateWithIssues(apiUrl, apiKey, model, systemPrompt, userPrompt, previousObj, issues, mode) {
  const res = await fetchWithTimeout(
    apiUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.45,
        max_tokens: mode === "timeline" ? 3400 : 2600,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "oc_profile",
            strict: true,
            schema: buildOutputSchema(mode),
          },
        },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
          { role: "assistant", content: JSON.stringify(previousObj) },
          {
            role: "user",
            content: [
              "上一个版本仍未通过对齐审稿，请在不破坏结构与信息密度前提下重写为新版本。",
              "必须逐条修复以下问题：",
              ...issues.map((x) => `- ${x}`),
              "只输出符合同一 JSON Schema 的完整对象。",
            ].join("\n"),
          },
        ],
      }),
    },
    26000
  );

  if (!res.ok) return null;
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  const parsed = parseStructuredOutput(raw, mode);
  return parsed.ok ? parsed.value : null;
}

function enforceTemplateShape(obj, mode, selections = []) {
  const safe = JSON.parse(JSON.stringify(obj || {}));
  const txt = (v, d = "") => {
    const s = String(v || "").trim();
    return s || d;
  };

  safe.overview = txt(safe.overview, "暂无总览，建议重试以获取更完整版本。");
  safe.world_slice = txt(safe.world_slice, "暂无世界切片，建议重试。");
  safe.mc_intel = txt(safe.mc_intel, "暂无MC情报，建议重试。");
  safe.relationship_dynamics = txt(safe.relationship_dynamics, "暂无关系动力学描述，建议重试。");
  safe.tradeoff_notes = txt(safe.tradeoff_notes, "当前版本优先保证一致性，细节风格可下一轮微调。");
  safe.regen_suggestion = txt(safe.regen_suggestion, "下一轮可增加具体场景与行为限制词。" );
  safe.opening_scene = txt(safe.opening_scene, "我在雨夜里看见他，城市的霓虹像一场迟到的审判。\n\n（系统兜底开场：建议重生成以获得完整文本。）");

  safe.male_profile = safe.male_profile || {};
  safe.male_profile.mbti = normalizeMbti(safe.male_profile.mbti) || "INTJ";
  safe.male_profile.enneagram = txt(safe.male_profile.enneagram, "5w4");
  safe.male_profile.instinctual_variant = normalizeInstinctVariant(safe.male_profile.instinctual_variant) || "sp/sx";
  safe.male_profile.profile_body = txt(safe.male_profile.profile_body, "暂无男主档案，建议重试获取完整背景。\n\n（系统兜底内容）");

  if (!Array.isArray(safe.axis_mapping)) safe.axis_mapping = [];
  safe.axis_mapping = safe.axis_mapping.map((x) => String(x || "").trim()).filter(Boolean);
  if (safe.axis_mapping.length < 4) {
    const fills = (Array.isArray(selections) ? selections : []).map((s) => `围绕${s.axis}轴（${s.option}）进行中度映射，保持一致性。`);
    for (const row of fills) {
      if (safe.axis_mapping.length >= 4) break;
      safe.axis_mapping.push(row);
    }
  }
  while (safe.axis_mapping.length < 4) {
    safe.axis_mapping.push("保留角色动机—关系拉扯—现实代价三层联动，避免模板化拼接。");
  }

  if (mode === "timeline") {
    safe.timeline = txt(safe.timeline, "第一幕建立关系张力；第二幕冲突升级并支付代价；第三幕完成终局兑现。");
    safe.ending_payoff = txt(safe.ending_payoff, "终局兑现与已选终局轴同向，给出情感与现实双重回收。");
  }

  return safe;
}

function renderStructuredMarkdown(obj, mode) {
  const lines = [
    "1) 设定总览（玩家上帝视角）",
    String(obj.overview || "").trim(),
    "",
    "2) 男主完整档案（玩家上帝视角）",
    `MBTI：${String(obj.male_profile?.mbti || "").toUpperCase()}`,
    `九型人格：${String(obj.male_profile?.enneagram || "").trim()}`,
    `副型：${String(obj.male_profile?.instinctual_variant || "").toLowerCase()}`,
    String(obj.male_profile?.profile_body || "").trim(),
    "",
    "3) 世界观与时代切片（玩家上帝视角）",
    String(obj.world_slice || "").trim(),
    "",
    "4) MC视角情报（她知道 / 不知道）",
    String(obj.mc_intel || "").trim(),
    "",
    "5) 关系初始动力学（此刻已成立）",
    String(obj.relationship_dynamics || "").trim(),
    "",
  ];

  if (mode === "timeline") {
    lines.push("6) 三幕时间线骨架（细节留白）");
    lines.push(String(obj.timeline || "").trim());
    lines.push("");
    lines.push("7) 终局兑现说明（与F/X/T/G相关轴对齐）");
    lines.push(String(obj.ending_payoff || "").trim());
    lines.push("");
    lines.push("8) 选轴映射说明");
  } else {
    lines.push("6) 选轴映射说明");
  }

  const mappings = Array.isArray(obj.axis_mapping) ? obj.axis_mapping : [];
  for (const m of mappings) lines.push(`- ${String(m).trim()}`);
  lines.push("");

  if (mode === "timeline") {
    lines.push("9) 矛盾度与取舍说明");
    lines.push(String(obj.tradeoff_notes || "").trim());
    lines.push("");
    lines.push("10) 下次重生成建议");
    lines.push(String(obj.regen_suggestion || "").trim());
    lines.push("");
    lines.push("11) 开场片段（250~450字，MC第一视角）");
  } else {
    lines.push("7) 矛盾度与取舍说明");
    lines.push(String(obj.tradeoff_notes || "").trim());
    lines.push("");
    lines.push("8) 下次重生成建议");
    lines.push(String(obj.regen_suggestion || "").trim());
    lines.push("");
    lines.push("9) 开场片段（300~500字，MC第一视角）");
  }

  lines.push(String(obj.opening_scene || "").trim());
  return lines.join("\n").trim();
}

function isRetryableStatus(status) {
  return [408, 409, 429, 500, 502, 503, 504, 520, 522, 524].includes(Number(status));
}

async function requestWithTransientRetries(apiUrl, apiKey, payload, opts = {}) {
  const retries = Math.max(0, Number(opts.retries || 0));
  const timeoutMs = Number(opts.timeoutMs || 0);

  let lastErr = null;
  let res = null;
  for (let i = 0; i <= retries; i++) {
    try {
      res = await fetchWithTimeout(
        apiUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        },
        timeoutMs
      );

      if (res.ok) return res;
      if (!isRetryableStatus(res.status) || i >= retries) return res;
      await sleep(450 * (i + 1));
    } catch (err) {
      lastErr = err;
      if (err?.name !== "TimeoutError" || i >= retries) throw err;
      await sleep(500 * (i + 1));
    }
  }

  if (lastErr) throw lastErr;
  return res;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, init, timeoutMs = 85000) {
  // timeoutMs <= 0 视为不主动超时，让上游/平台自身超时策略接管。
  if (!(Number(timeoutMs) > 0)) {
    return await fetch(url, init);
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (err) {
    if (err?.name === "AbortError") {
      const e = new Error("Upstream request timed out");
      e.name = "TimeoutError";
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(),
    },
  });
}
