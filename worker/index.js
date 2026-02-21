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
  let body = {};
  try {
    body = await request.json();
    const result = await runGeneration(body, env);
    return json({ content: result.content, meta: result.meta }, 200);
  } catch (err) {
    if (shouldEmergencyFallback(err)) {
      const emergency = buildEmergencyResult(body, `degraded:${err?.name || "error"}:${err?.message || "upstream"}`);
      return json({ content: emergency.content, meta: emergency.meta }, 200);
    }
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
      if (shouldEmergencyFallback(err)) {
        const emergency = buildEmergencyResult(body, `degraded:${err?.name || "error"}:${err?.message || "upstream"}`);
        await send({ type: "done", content: emergency.content, meta: emergency.meta });
      } else {
        const mapped = mapError(err);
        await send({ type: "error", error: mapped.message, code: mapped.code || "GEN_ERROR" });
      }
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
  const { selections = [], model: requestedModel = "", extraPrompt = "" } = body || {};
  const model = (env.PRIMARY_MODEL || requestedModel || "glm-5").trim();

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

  const totalBudgetMs = Number(env.TOTAL_BUDGET_MS || 90000);
  const deadline = Date.now() + totalBudgetMs;
  const remainingMs = () => Math.max(0, deadline - Date.now());
  const boundedTimeout = (targetMs, reserveMs = 2000, floorMs = 5000) => {
    const r = remainingMs() - reserveMs;
    if (r <= 0) {
      const e = new Error("Upstream request timed out");
      e.name = "TimeoutError";
      throw e;
    }
    return Math.max(Math.min(targetMs, r), floorMs);
  };

  // Step 4: 先做超短草案（无快模型时同模型短超时），仅作为扩写参考；失败直接跳过，不影响主流程。
  let draftText = "";
  const draftEnabled = String(env.ENABLE_DRAFT_STAGE || "false").toLowerCase() === "true";
  if (draftEnabled) {
    const draftTimeoutMs = Number(env.DRAFT_TIMEOUT_MS || 10000);
    try {
      mark("draft_request_started", { model, timeoutMs: draftTimeoutMs });
      const draftRes = await requestWithTransientRetries(
        apiUrl,
        apiKey,
        {
          model,
          temperature: 0.25,
          max_tokens: 500,
          messages: [
            { role: "system", content: "你是设定草案器。输出简短要点，不要长文。" },
            { role: "user", content: `${userPrompt}\n\n请先给出 5-8 条极简草案要点，中文。` },
          ],
        },
        { timeoutMs: boundedTimeout(draftTimeoutMs, 4000, 3000), retries: 0 }
      );

      if (draftRes.ok) {
        const draftData = await draftRes.json();
        draftText = String(draftData?.choices?.[0]?.message?.content || "").trim().slice(0, 900);
        if (draftText) mark("draft_response_received", { size: draftText.length });
      }
    } catch (err) {
      if (err?.name === "TimeoutError") {
        mark("draft_timeout");
      }
    }
  }

  const finalUserPrompt = draftText
    ? `${userPrompt}\n\n参考草案（用于对齐方向，可重写优化）：\n${draftText}`
    : userPrompt;

  // 主生成：总预算内执行，避免长尾拖死。
  const supportsJsonSchema = !String(apiUrl).includes("bigmodel.cn");
  const payload = {
    model,
    temperature: 0.62,
    max_tokens: mode === "timeline" ? 2200 : 1600,
    ...(supportsJsonSchema
      ? {
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "oc_profile",
              strict: true,
              schema: buildOutputSchema(mode),
            },
          },
        }
      : {}),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: finalUserPrompt },
    ],
  };

  const primaryTimeoutMs = Number(env.PRIMARY_TIMEOUT_MS || 85000);
  const fallbackTimeoutMs = Number(env.FALLBACK_TIMEOUT_MS || 70000);

  mark("upstream_request_started", { model });
  let upstream = null;
  let primaryTimeout = false;

  try {
    upstream = await requestWithTransientRetries(apiUrl, apiKey, payload, { timeoutMs: boundedTimeout(primaryTimeoutMs, 2500, 5000), retries: 0 });
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
    const fbTimeout = boundedTimeout(fallbackTimeoutMs, 1500, 4000);
    mark("fallback_request_started", { model: fallbackModel, timeoutMs: fbTimeout });
    finalModel = fallbackModel;
    upstream = await requestWithTransientRetries(apiUrl, apiKey, { ...payload, model: fallbackModel }, { timeoutMs: fbTimeout, retries: 0 });
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
  const rawContent = extractModelContent(data);
  if (!rawContent) {
    const e = new Error(`No content in model response. shape=${JSON.stringify(Object.keys(data || {})).slice(0, 200)}`);
    e.status = 502;
    throw e;
  }
  const cleanedRawContent = sanitizeModelRawContent(rawContent);
  if (cleanedRawContent !== rawContent) {
    repaired = true;
    mark("reasoning_scaffold_removed");
  }

  let structured = parseStructuredOutput(cleanedRawContent, mode);
  if (!structured.ok) {
    mark("structured_parse_failed", { reason: structured.reason });

    const narrativeObj = tryParseNarrativeOutput(cleanedRawContent, mode, null);
    if (narrativeObj) {
      const parsedNarrative = parseStructuredOutput(narrativeObj, mode);
      if (parsedNarrative.ok) {
        structured = parsedNarrative;
        repaired = true;
        mark("structured_narrative_recovered");
      }
    }

    if (!structured.ok) {
      const parseFailReason = structured.reason || "parse_failed";
      const coerced = await coerceToSchemaJson(apiUrl, apiKey, finalModel, cleanedRawContent, mode);
      if (coerced) {
        structured = { ok: true, value: coerced };
        repaired = true;
        mark("structured_parse_recovered");
      } else {
        structured = {
          ok: true,
          value: synthesizeStructuredFromRaw(cleanedRawContent, mode, selections, extraPrompt),
        };
        repaired = true;
        mark("structured_parse_fallback_applied", { reason: parseFailReason });
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
      // 二次模型重写在高峰期极易触发长尾超时，先采用本地字段修复以保证稳定可用。
      structured = { ok: true, value: repairStructuredFieldsLocally(structured.value, mode, selections) };
      repaired = true;
      issues = [];
      mark("alignment_repair_applied", { round: 2, strategy: "local_only" });

      mark("alignment_check_started", { round: 2, maxAlignRounds: 2, enableModelAudit: false });
      issues = checkProgrammaticAlignment(structured.value, selections, extraPrompt);
      if (issues.length) {
        mark("alignment_check_failed", { round: 2, issues: issues.length });
        structured = { ok: true, value: repairStructuredFieldsLocally(structured.value, mode, selections) };
        repaired = true;
        issues = [];
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

function shouldEmergencyFallback(err) {
  if (!err) return true;
  if (err?.name === "TimeoutError") return true;

  const status = Number(err?.status || 500);
  if (status >= 500) return true;
  if ([408, 409, 429, 520, 522, 524].includes(status)) return true;
  // 参数校验错误（如少于3项选择）保留给前端显式提示，不走应急内容。
  if (status >= 400 && status < 500) return false;
  return true;
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
  const scrubReasoning = (s) => stripReasoningScaffold(String(s || ""));

  safe.overview = scrubName(scrubReasoning(safe.overview || ""));
  safe.world_slice = scrubName(scrubReasoning(safe.world_slice || ""));
  safe.mc_intel = scrubName(scrubReasoning(safe.mc_intel || ""));
  safe.relationship_dynamics = scrubName(scrubReasoning(safe.relationship_dynamics || ""));
  safe.opening_scene = scrubName(scrubReasoning(safe.opening_scene || ""));

  safe.male_profile = safe.male_profile || {};
  safe.male_profile.profile_body = scrubName(scrubReasoning(String(safe.male_profile.profile_body || "")));

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
  if (looksLikeReasoningLeak(textFields)) issues.push("疑似把分析过程当成最终正文输出");
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

  if (!String(obj.male_profile.enneagram || "").trim()) {
    obj.male_profile.enneagram = extractEnneagramFromText(mergedProfileText) || "5w4";
  }

  const iv = normalizeInstinctVariant(obj.male_profile.instinctual_variant) || extractInstinctFromText(mergedProfileText);
  obj.male_profile.instinctual_variant = iv || "sp/sx";

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
      obj[key] = synthesizeFieldFromRaw(raw, key, minLen);
    }
  }

  obj.male_profile.profile_body = normalizeTextField(obj.male_profile.profile_body);
  if (obj.male_profile.profile_body.length < 300) {
    obj.male_profile.profile_body = synthesizeFieldFromRaw(raw, "profile_body", 360);
  }

  if (!Array.isArray(obj.axis_mapping)) obj.axis_mapping = [];
  obj.axis_mapping = obj.axis_mapping.map((x) => normalizeTextField(x)).filter(Boolean);
  if (obj.axis_mapping.length < 3) {
    obj.axis_mapping = [
      ...obj.axis_mapping,
      "围绕已选轴构建角色动机与关系冲突，避免反向设定。",
      "保持世界阻力—个人选择—关系代价三层联动。",
      "让开场信息与后续推进保持同一叙事方向。",
    ].slice(0, 4);
  }

  if (mode === "timeline") {
    obj.timeline = normalizeTextField(obj.timeline);
    obj.ending_payoff = normalizeTextField(obj.ending_payoff);
    if (obj.timeline.length < 100) obj.timeline = synthesizeFieldFromRaw(raw, "timeline", 160);
    if (obj.ending_payoff.length < 60) obj.ending_payoff = synthesizeFieldFromRaw(raw, "ending_payoff", 100);
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

function synthesizeStructuredFromRaw(raw, mode, selections = [], extraPrompt = "") {
  const picked = (Array.isArray(selections) ? selections : []).slice(0, 6);
  const axisMapping = picked
    .map((s) => `围绕${s.axis}轴（${s.option}）进行中度映射，保持与补充提示词一致。`);

  const obj = {
    overview: synthesizeFieldFromRaw(raw, "overview", 180),
    male_profile: {
      mbti: extractMbtiFromText(raw) || "INTJ",
      enneagram: extractEnneagramFromText(raw) || "5w4",
      instinctual_variant: extractInstinctFromText(raw) || "sp/sx",
      profile_body: synthesizeFieldFromRaw(`${raw}\n${extraPrompt}`, "profile_body", mode === "timeline" ? 720 : 560),
    },
    world_slice: synthesizeFieldFromRaw(raw, "world_slice", 140),
    mc_intel: synthesizeFieldFromRaw(`${raw}\n补充偏好：${extraPrompt}`, "mc_intel", 120),
    relationship_dynamics: synthesizeFieldFromRaw(raw, "relationship_dynamics", 130),
    axis_mapping: axisMapping.length ? axisMapping : [
      "围绕已选轴构建角色动机与关系冲突，避免反向设定。",
      "保持世界阻力—个人选择—关系代价三层联动。",
      "让开场信息与后续推进保持同一叙事方向。",
      "优先保证稳定可读，再逐轮提高细节密度。",
    ],
    tradeoff_notes: synthesizeFieldFromRaw(raw, "tradeoff_notes", 28),
    regen_suggestion: synthesizeFieldFromRaw(extraPrompt || raw, "regen_suggestion", 20),
    opening_scene: synthesizeFieldFromRaw(raw, "opening_scene", mode === "timeline" ? 250 : 300),
  };

  if (mode === "timeline") {
    obj.timeline = synthesizeFieldFromRaw(raw, "timeline", 200);
    obj.ending_payoff = synthesizeFieldFromRaw(raw, "ending_payoff", 120);
  }

  return obj;
}

function synthesizeFieldFromRaw(raw, key, minLen = 80) {
  const base = normalizeTextField(sanitizeModelRawContent(raw))
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[{}\[\]"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const fallbackByKey = {
    overview: "该版本由系统自动兜底修复：男主设定围绕已选轴构建，保证角色动机、世界阻力与关系拉扯同向推进。",
    world_slice: "世界切片强调现实约束与关系成本并存，外部秩序与个体选择互相挤压，形成持续冲突场。",
    mc_intel: "MC可见层面以行为证据为主，不可见层面保留关键动机与代价，以维持后续推进张力。",
    relationship_dynamics: "关系初态为吸引与风险并行：亲密推进伴随权力与边界协商，误读与确认交替出现。",
    tradeoff_notes: "本版优先稳定可用与结构一致，风格细节可在下一轮按偏好增强。",
    regen_suggestion: "下轮可补充禁写项、冲突阈值与开场场景关键词，以提升贴脸度。",
    opening_scene: "雨夜里，城市把每盏灯都擦得过亮。我站在檐下，看他从人群尽头走来，外套上沾着潮气，像刚从另一场更冷的现实里脱身。他抬眼时并不急着靠近，只在一步之外停住，像在确认我是否仍在原地。风把广告屏的蓝光切成碎片，落在他指节上，旧伤像一道被时间反复描过的线。那一刻我忽然明白：我们之间从来不是‘是否相爱’的问题，而是愿不愿意一起承担爱之后的代价。",
    profile_body: "他的成长路径并不平顺，早期经验塑造了强控制与高警觉并存的性格结构：在外部规则前保持理性、克制与执行力，在亲密关系里却会因真实投入而暴露软肋。他擅长把风险前置处理，习惯用计划和秩序抵御失控，但这也让他在情绪表达上显得迟钝或过度防御。与MC相遇后，他的行为从单点生存转向双人协商：一方面仍坚持边界与现实判断，另一方面逐步学习在不确定中信任、让渡与承担。过去塑造了他的锋利，现在决定他是否愿意把锋利收回。",
    timeline: "第一幕建立关系与现实约束：双方因共同处境被迫靠近；第二幕冲突升级并支付代价：误读、外压与个人执念叠加；第三幕完成终局兑现：在失去与保留之间做出不可逆选择。",
    ending_payoff: "终局强调情感与现实双重回收：关系走向与已选终局轴一致，代价被明确命名且不被粉饰。",
  };

  const fillerByKey = {
    overview: "本稿优先保证设定逻辑闭环，细节风格与冲突强度可在后续重生成中继续拉高。",
    world_slice: "这种外部压力并非背景装饰，而会持续改写角色选择与关系推进节奏。",
    mc_intel: "信息差不会一次性摊开，而会在关键节点以行为证据逐步揭示。",
    relationship_dynamics: "关系张力来自边界协商与现实代价同步增长，而非单点情绪爆发。",
    tradeoff_notes: "取舍重点是可读性、稳定性和设定一致性。",
    regen_suggestion: "下轮可补充禁写项和开场镜头关键词。",
    opening_scene: "镜头建议保持动作证据优先，让情绪在细节里慢慢抬升。",
    profile_body: "建议在下一轮补充职业细节、创伤触发点与关键关系事件，以增强立体度。",
    timeline: "三幕结构可继续细化到具体节点事件与代价回收。",
    ending_payoff: "终局可增加选择后果与关系状态的双线回收。",
  };

  const seed = (base || fallbackByKey[key] || fallbackByKey.overview || "").trim();
  if (seed.length >= minLen) return seed;
  let out = seed;
  let guard = 0;
  while (out.length < minLen && guard < 6) {
    out += ` ${fillerByKey[key] || fillerByKey.overview}`;
    guard += 1;
  }
  return out.trim();
}

function normalizeTextField(value) {
  if (typeof value === "string") {
    return sanitizeModelRawContent(
      value
      .replace(/```[\s\S]*?```/g, (m) => m.replace(/```(?:json|markdown|md|txt)?/gi, "").replace(/```/g, "").trim())
      .replace(/```+/g, "")
      .replace(/^\s*(json|markdown)\s*$/gim, "")
      .trim()
    );
  }
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

function looksLikeReasoningLeak(text) {
  const src = String(text || "");
  if (!src.trim()) return false;
  const markers = [
    "分析用户请求",
    "解构并综合",
    "思维沙盘",
    "对照约束进行最终审查",
    "构建 JSON",
    "完善 JSON 结构",
    "起草档案字段",
    "撰写 profile_body",
    "输出格式： 严格的 JSON 对象",
  ];
  const markerHits = markers.reduce((n, k) => n + (src.includes(k) ? 1 : 0), 0);
  const numberedBlocks = (src.match(/(^|\n)\s*\d+\.\s+/g) || []).length;
  return markerHits >= 2 || (markerHits >= 1 && numberedBlocks >= 4);
}

function stripReasoningScaffold(text) {
  if (!text) return "";
  let out = String(text);

  // 典型“先分析再输出”脚手架段落，直接移除
  out = out
    .replace(/(^|\n)\s*\d+\.\s*(分析用户请求|解构并综合角色概念|起草档案字段|完善 JSON 结构|撰写 profile_body|对照约束进行最终审查|构建 JSON)[\s\S]*?(?=(\n\s*\d+\.\s)|$)/g, "\n")
    .replace(/(^|\n)\s*(角色：|输出格式：|目标：|硬约束：|映射规则：|模式：|补充约束：).*/g, "\n");

  out = out.replace(/\n{3,}/g, "\n\n").trim();
  return out;
}

function sanitizeModelRawContent(text) {
  const src = String(text || "");
  if (!src.trim()) return "";
  const stripped = stripReasoningScaffold(src);
  if (!stripped.trim()) return "";
  if (looksLikeReasoningLeak(stripped)) return "";
  return stripped;
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

function extractEnneagramFromText(text) {
  const src = String(text || "");
  const m = src.match(/(?:九型人格|enneagram)\s*[：:]?\s*([1-9](?:w[1-9])?)/i);
  if (m?.[1]) return m[1].toLowerCase();
  const fallback = src.match(/\b([1-9]w[1-9])\b/i);
  return fallback?.[1]?.toLowerCase() || "";
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

function extractModelContent(data) {
  const choice = data?.choices?.[0] || data?.data?.choices?.[0] || null;
  const msg = choice?.message || {};

  const cands = [
    msg?.content,
    msg?.reasoning_content,
    choice?.content,
    data?.output_text,
    data?.text,
    data?.result,
  ];

  for (const c of cands) {
    const t = normalizeTextField(c);
    if (t) return t;
  }

  // 兼容内容块数组
  if (Array.isArray(msg?.content)) {
    const joined = msg.content.map((x) => normalizeTextField(x?.text || x?.content || x)).join("\n").trim();
    if (joined) return joined;
  }

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
  const supportsJsonSchema = !String(apiUrl).includes("bigmodel.cn");
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
        max_tokens: mode === "timeline" ? 2400 : 1700,
        ...(supportsJsonSchema
          ? {
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "oc_profile",
                  strict: true,
                  schema: buildOutputSchema(mode),
                },
              },
            }
          : {}),
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
  const supportsJsonSchema = !String(apiUrl).includes("bigmodel.cn");
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
        max_tokens: mode === "timeline" ? 2200 : 1600,
        ...(supportsJsonSchema
          ? {
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "oc_profile",
                  strict: true,
                  schema: buildOutputSchema(mode),
                },
              },
            }
          : {}),
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

  safe.overview = txt(safe.overview, "该版本为稳定降级生成：已按选轴建立人物驱动、世界阻力与关系张力的基础骨架，可直接用于二次精修。");
  safe.world_slice = txt(safe.world_slice, "世界层处于高摩擦状态：秩序压力与个体欲望并存，关系推进需要持续支付现实成本。");
  safe.mc_intel = txt(safe.mc_intel, "MC当前可见的是行为与态度，不可见的是男主动机与代价清单；这种信息差将驱动后续冲突与确认。");
  safe.relationship_dynamics = txt(safe.relationship_dynamics, "关系初态并非纯甜或纯虐，而是‘吸引+防御’并行：双方靠近的同时保持边界试探。");
  safe.tradeoff_notes = txt(safe.tradeoff_notes, "当前版本优先保证一致性，细节风格可下一轮微调。");
  safe.regen_suggestion = txt(safe.regen_suggestion, "下一轮可增加具体场景与行为限制词。" );
  safe.opening_scene = txt(safe.opening_scene, "雨从高架桥的边缘垂下来，像一层薄而冷的帘。我站在便利店门口，看见他逆着人流走来，外套肩线被雨水压得更硬，眼神却比夜色更安静。他在两步外停下，没有先解释迟到，也没有碰我，只低声问一句：‘你还愿意听我把话说完吗？’广告屏的蓝光掠过他指节，旧伤在那一瞬亮了一下，像某种被反复掩埋又反复浮出的证据。我忽然意识到，我们真正要谈的不是对错，而是谁先承认：这段关系从开始就不是无成本的。");

  safe.male_profile = safe.male_profile || {};
  safe.male_profile.mbti = normalizeMbti(safe.male_profile.mbti) || "INTJ";
  safe.male_profile.enneagram = txt(safe.male_profile.enneagram, "5w4");
  safe.male_profile.instinctual_variant = normalizeInstinctVariant(safe.male_profile.instinctual_variant) || "sp/sx";
  safe.male_profile.profile_body = txt(safe.male_profile.profile_body, "他早期在高压环境中形成了强控制与高警觉并存的生存策略：对外执行力强、情绪收束严，对内却长期压抑真实需求。与MC的接触迫使他从‘单点生存’转向‘双人协商’，这会让他在关系里暴露软肋，也逼迫他重写价值排序。该角色的核心矛盾不是爱不爱，而是能否在不失去自我边界的前提下承担亲密关系的现实代价。");

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

function buildEmergencyResult(body = {}, reason = "timeout") {
  const selections = Array.isArray(body?.selections) ? body.selections : [];
  const mode = detectMode(selections);
  const safeReason = normalizeEmergencyReason(reason);
  const shaped = buildEmergencyStructured(mode, selections, String(body?.extraPrompt || ""));

  return {
    content: renderStructuredMarkdown(shaped, mode),
    meta: {
      mode,
      repaired: true,
      trace: [{ stage: "emergency_fallback", t: 0, reason: safeReason }],
      totalMs: 0,
      finalModel: "emergency-local",
      fallbackUsed: true,
    },
  };
}

function normalizeEmergencyReason(reason) {
  const src = String(reason || "").toLowerCase();
  if (!src) return "degraded";
  if (src.includes("timeout")) return "timeout";
  if (src.includes("no content")) return "no_content";
  if (src.includes("json")) return "parse_failed";
  if (src.includes("upstream")) return "upstream_error";
  return "degraded";
}

function buildEmergencyStructured(mode, selections = [], extraPrompt = "") {
  const picked = (Array.isArray(selections) ? selections : []).slice(0, 6);
  const pickedText = picked.length
    ? picked.map((s) => `${s.axis}轴(${s.option})`).join("、")
    : "已选轴";
  const extra = String(extraPrompt || "").trim();

  const base = {
    overview: `这是降级兜底版本：围绕${pickedText}构建单一男主实现，先保证关系动力、现实阻力与人物选择三层闭环，再留出下一轮精修空间。`,
    male_profile: {
      mbti: "INTJ",
      enneagram: "5w4",
      instinctual_variant: "sp/sx",
      profile_body: [
        "他在长期高压与规则环境中形成了强控制与高警觉并存的生存结构：对外克制、执行力强、风险前置；对内却长期压抑真实需求，情绪表达偏迟滞。",
        "过去经历让他把“稳定”看得高于一切，因此在亲密关系里常以边界管理代替直接示弱。与MC相遇后，他的行为从单点自保转向双人协商：仍坚持现实判断，但开始学习让渡、信任与共同承担。",
        extra ? `补充约束已吸收：${extra}。` : "当前版本优先可读与一致性，细节风格将在后续重生成中增强。",
      ].join(""),
    },
    world_slice: "世界层面处于持续摩擦态：秩序压力与个人欲望并存，关系推进必须支付现实成本，因此每一次靠近都伴随风险评估与代价累积。",
    mc_intel: "MC当前能看到的是可靠与克制，看不到的是男主对失控的恐惧与对关系代价的预判；这种信息差会驱动后续冲突与确认节奏。",
    relationship_dynamics: "关系初态并非纯甜或纯虐，而是吸引与防御并行：靠近会触发边界协商，边界被尊重时亲密推进，边界被误读时冲突放大。",
    axis_mapping: picked.length
      ? picked.map((s) => `围绕${s.axis}轴（${s.option}）做中度映射，保持与其他轴同向，不反向抵消。`)
      : [
          "围绕已选轴建立人物动机、关系拉扯与现实代价的三层联动。",
          "优先保证结构可用，再做文风和冲突强度优化。",
          "避免模板式堆砌，强调因果链连续性。",
          "保留后续重生成扩展空间。",
        ],
    tradeoff_notes: "本版为稳定兜底稿：优先确保可读、完整与约束一致，暂不追求极致文风。",
    regen_suggestion: extra
      ? `下轮建议保留“${extra.slice(0, 80)}”并补充禁写项与开场镜头关键词。`
      : "下轮建议补充禁写项、冲突阈值和开场场景关键词以提升贴脸度。",
    opening_scene: "雨夜里，风把霓虹切成碎片。我站在檐下看他从街角走来，脚步很稳，像先把所有风险都算过一遍。他停在一步之外，没有碰我，也没有先解释迟到，只低声问：‘你现在最需要我做什么？’那一瞬我忽然明白，他不是不会表达，而是每一次靠近都要先穿过现实这道门。我们要面对的从来不只是喜欢与否，而是谁愿意先承认：这段关系天生带着代价。",
  };

  if (mode === "timeline") {
    base.timeline = "第一幕建立关系与现实阻力；第二幕误读叠加并支付代价；第三幕做出不可逆选择并完成终局回收。";
    base.ending_payoff = "终局与已选终局相关轴同向兑现：明确谁失去什么、关系保留什么、代价如何落地。";
  }

  return enforceTemplateShape(base, mode, selections);
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
