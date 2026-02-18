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

  const payload = {
    model,
    temperature: 0.65,
    max_tokens: mode === "timeline" ? 3600 : 2800,
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

  let upstream;
  let finalModel = model;
  const fallbackModel = (env.FALLBACK_MODEL || "").trim();

  mark("upstream_request_started", { model });
  upstream = await requestWithTransientRetries(
    apiUrl,
    apiKey,
    payload,
    { timeoutMs: 120000, retries: 1 }
  );

  if (!upstream.ok && isRetryableStatus(upstream.status) && fallbackModel) {
    mark("upstream_retryable_error", { status: upstream.status, fallbackModel });
    mark("fallback_request_started", { model: fallbackModel });
    finalModel = fallbackModel;
    upstream = await requestWithTransientRetries(
      apiUrl,
      apiKey,
      { ...payload, model: fallbackModel, temperature: 0.55, max_tokens: Math.min(payload.max_tokens, 2800) },
      { timeoutMs: 32000, retries: 1 }
    );
    mark("fallback_response_received", { status: upstream.status });
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    mark("upstream_error", { status: upstream.status });
    const e = new Error(`Upstream error(${upstream.status}): ${text}`);
    e.status = upstream.status;
    throw e;
  }

  mark("upstream_response_received");
  const data = await upstream.json();
  const finishReason = data?.choices?.[0]?.finish_reason;
  let rawContent = data?.choices?.[0]?.message?.content;

  if (finishReason === "length") {
    mark("upstream_truncated_retry");
    const retryPayload = { ...payload, temperature: 0.45, max_tokens: Math.min(payload.max_tokens, mode === "timeline" ? 3200 : 2400) };
    const retryRes = await requestWithTransientRetries(apiUrl, apiKey, retryPayload, { timeoutMs: 40000, retries: 1 });
    if (retryRes.ok) {
      const retryData = await retryRes.json();
      rawContent = retryData?.choices?.[0]?.message?.content || rawContent;
    }
  }

  if (!rawContent) {
    const e = new Error("No content in model response.");
    e.status = 502;
    throw e;
  }

  let repaired = false;
  let structured = parseStructuredOutput(rawContent, mode);
  if (!structured.ok) {
    mark("structured_parse_failed", { reason: structured.reason });
    const coerced = await coerceToSchemaJson(apiUrl, apiKey, model, rawContent, mode);
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

  const maxAlignRounds = Math.max(1, Number(env.ALIGNMENT_MAX_ROUNDS || 2));
  const enableModelAudit = String(env.ENABLE_MODEL_AUDIT || "false").toLowerCase() === "true";
  let alignPass = false;
  let lastIssues = [];

  for (let round = 1; round <= maxAlignRounds; round++) {
    mark("alignment_check_started", { round, maxAlignRounds, enableModelAudit });
    const ruleIssues = checkProgrammaticAlignment(structured.value, selections, extraPrompt);
    let check = { pass: ruleIssues.length === 0, issues: ruleIssues };

    if (!check.pass) {
      mark("alignment_rule_failed", { round, issues: ruleIssues.length });
    } else if (enableModelAudit) {
      // 可选：模型语义审稿（默认关闭，避免额外长耗时）
      check = await runAlignmentCheck(apiUrl, apiKey, model, structured.value, selections, extraPrompt, mode);
    }

    if (check.pass) {
      alignPass = true;
      mark("alignment_check_passed", { round });
      break;
    }

    lastIssues = check.issues;
    mark("alignment_check_failed", { round, issues: check.issues.length });

    if (round >= maxAlignRounds) break;

    mark("alignment_repair_started", { round: round + 1 });
    const repairedObj = await regenerateWithIssues(apiUrl, apiKey, model, systemPrompt, userPrompt, structured.value, check.issues, mode);
    if (!repairedObj) {
      mark("alignment_repair_failed", { round: round + 1 });
      continue;
    }

    structured = { ok: true, value: repairedObj };
    repaired = true;
    mark("alignment_repair_applied", { round: round + 1 });
  }

  if (!alignPass) {
    const e = new Error(`生成内容与选轴/补充提示词不一致：${lastIssues.slice(0, 3).join("；") || "请重试"}`);
    e.status = 502;
    throw e;
  }

  const content = renderStructuredMarkdown(structured.value, mode);
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
        "模型响应超时（单次请求上限约120秒，已自动重试/降级）。通常是上游拥塞或当前提示过重；请重试。",
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
        const long = String(s.longDetail || "").trim();
        const detail = String(s.detail || "").trim();
        const chunks = [`- ${s.axis}: ${s.option}`];
        if (detail) chunks.push(`短释义：${detail}`);
        if (long) chunks.push(`扩展说明：${long}`);
        return chunks.join("｜");
      })
      .join("\n"),
    extraPrompt ? `\n补充提示词/约束：${extraPrompt}` : "",
    "\n生成原则：先写出自然连贯的故事内核，再让轴作为边界约束中度映射。",
    "不要逐条把轴机械翻译成剧情句；避免‘拼装感/缝合感’。",
    "不要把轴选项名称直接抄成世界观实体名；除非用户明确要求，否则按语义隐喻处理。",
    "‘矛盾度与取舍说明’和‘下次重生成建议’仅在确有必要时展开；若本次组合本身自洽，可用简短占位语句。",
    "请在最终输出前做一次整体自检：确保与提炼硬约束一致，不一致则先改写后输出。",
    "男主完整档案内的人格字段必须完整：MBTI、九型人格、副型（sp/sx/so之一主副组合）。",
    "提醒：输出中可说明‘这是所有可能性中的一种实现’，但正文必须完整具体。"
  ].join("\n");
}

function buildAlignmentCheckPrompt(structured, selections, extraPrompt, mode) {
  return [
    `你是设定对齐审稿器。请检查稿件是否严格跟随用户选轴与补充提示词（模式：${mode}）。`,
    "返回 JSON：{\"pass\": boolean, \"issues\": string[]}。仅输出 JSON。",
    "判定标准：",
    "1) 是否明显违背已选轴语义（允许中度映射，但不能反向）。",
    "2) 是否落实补充提示词中的硬约束。",
    "3) MC是否被命名（开场片段也不允许给出姓名）。",
    "4) 男主档案是否是详细背景而非简历条目。",
    "5) MBTI / 九型人格 / 副型字段是否完整。",
    "若任一失败，pass=false 并给出可执行问题列表。",
    "已选轴：",
    selections.map((s) => `- ${s.axis}: ${s.option}${s.detail ? `（${s.detail}）` : ""}${s.longDetail ? `｜扩展说明：${s.longDetail}` : ""}`).join("\n"),
    extraPrompt ? `补充提示词：${extraPrompt}` : "补充提示词：无",
    "待审稿件(JSON对象)：",
    JSON.stringify(structured),
  ].join("\n");
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

  const axisHits = (Array.isArray(selections) ? selections : []).filter((s) => {
    const keywords = [String(s?.option || ""), String(s?.detail || "")]
      .flatMap((x) => x.split(/[（）、，。\s\-:：|]+/))
      .map((x) => x.trim())
      .filter((x) => x.length >= 2)
      .slice(0, 5);
    return keywords.some((k) => textFields.includes(k));
  }).length;

  if ((selections?.length || 0) >= 3 && axisHits < 2) issues.push("文本与选轴显式关联过弱，疑似未跟随选项");

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

function parseAlignmentResult(raw) {
  try {
    const text = String(raw || "").trim();
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { pass: false, issues: ["审稿器未返回JSON"] };
    const obj = JSON.parse(m[0]);
    const pass = Boolean(obj?.pass);
    const issues = Array.isArray(obj?.issues)
      ? obj.issues.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 8)
      : [];
    return { pass, issues: pass ? [] : (issues.length ? issues : ["存在未说明的对齐问题"]) };
  } catch {
    return { pass: false, issues: ["审稿器结果解析失败"] };
  }
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
  if (!obj.male_profile || typeof obj.male_profile !== "object") return { ok: false, reason: "缺少 male_profile" };
  if (!/^[EI][NS][FT][JP]$/i.test(String(obj.male_profile.mbti || ""))) return { ok: false, reason: "MBTI 非法" };
  if (!String(obj.male_profile.enneagram || "").trim()) return { ok: false, reason: "缺少九型人格" };
  if (!/^(sp|sx|so)\/(sp|sx|so)$/i.test(String(obj.male_profile.instinctual_variant || ""))) return { ok: false, reason: "副型非法" };
  if (mode === "timeline" && !String(obj.timeline || "").trim()) return { ok: false, reason: "缺少三幕时间线" };
  return { ok: true, value: obj };
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

async function runAlignmentCheck(apiUrl, apiKey, model, structured, selections, extraPrompt, mode) {
  const prompt = buildAlignmentCheckPrompt(structured, selections, extraPrompt, mode);
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
        temperature: 0.1,
        max_tokens: 800,
        messages: [
          { role: "system", content: "你是严格审稿器，只输出 JSON。" },
          { role: "user", content: prompt },
        ],
      }),
    },
    22000
  );

  if (!res.ok) {
    return { pass: false, issues: [`审稿器请求失败(${res.status})`] };
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  return parseAlignmentResult(raw);
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
    35000
  );

  if (!res.ok) return null;
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  const parsed = parseStructuredOutput(raw, mode);
  return parsed.ok ? parsed.value : null;
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
