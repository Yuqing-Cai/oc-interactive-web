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

  const strictOutput = String(env.STRICT_OUTPUT || "false").toLowerCase() === "true";

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

  const systemPrompt = buildSystemPrompt(mode, strictOutput);
  const userPrompt = buildUserPrompt(selections, extraPrompt, mode);

  const payload = {
    model,
    temperature: 0.9,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  let upstream;
  let finalModel = model;
  mark("upstream_request_started", { model });
  try {
    upstream = await fetchWithTimeout(
      apiUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      },
      0
    );
  } catch (err) {
    if (err?.name === "TimeoutError") {
      const fallbackModel = (env.FALLBACK_MODEL || "").trim();
      mark("upstream_timeout", { model, fallbackModel: fallbackModel || "<disabled>" });

      if (!fallbackModel) {
        throw err;
      }

      mark("fallback_request_started", { model: fallbackModel });
      finalModel = fallbackModel;
      upstream = await fetchWithTimeout(
        apiUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ ...payload, model: fallbackModel, temperature: 0.8 }),
        },
        28000
      );
      mark("fallback_response_received", { status: upstream.status });
    } else {
      throw err;
    }
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    mark("upstream_error", { status: upstream.status });
    const e = new Error(`Upstream error: ${text}`);
    e.status = upstream.status;
    throw e;
  }

  mark("upstream_response_received");
  const data = await upstream.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  let content = sanitizeModelOutput(rawContent);

  if (!content) {
    const e = new Error("No content in model response.");
    e.status = 502;
    throw e;
  }

  let repaired = false;
  if (strictOutput) {
    const check = validateOutput(content, mode);
    mark("output_validated", { ok: check.ok, missing: check.missing.length });

    if (!check.ok) {
      const repairPrompt = buildRepairPrompt(content, check.missing, mode);
      mark("repair_started");
      const repairUpstream = await fetchWithTimeout(
        apiUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.6,
            messages: [
              {
                role: "system",
                content:
                  "你是文本修复器。仅输出最终成稿，不要解释修复过程，不要输出任何注释、前言、后记、思考过程。",
              },
              { role: "user", content: repairPrompt },
            ],
          }),
        },
        12000
      );

      if (repairUpstream.ok) {
        const repairData = await repairUpstream.json();
        const repairedContent = sanitizeModelOutput(repairData?.choices?.[0]?.message?.content);
        if (repairedContent) {
          content = repairedContent;
          repaired = true;
          mark("repair_applied");
        } else {
          mark("repair_empty");
        }
      } else {
        mark("repair_failed", { status: repairUpstream.status });
      }
    } else {
      mark("repair_skipped");
    }
  } else {
    mark("output_validated", { ok: true, skipped: true });
    mark("repair_skipped", { skipped: true });
  }

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
        "模型响应超时（已达到服务端等待上限）。通常是上游生成耗时过长或短时波动，不代表你的本地网络有问题。",
    };
  }
  return {
    status: err?.status || 500,
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

function buildSystemPrompt(mode, strictOutput = false) {
  const common = [
    "你是‘OC男主设定总设计师’。",
    "同一组选项可能对应许多自洽男主；此处只输出一种高完成度实现。",
    "输出必须并列呈现：玩家上帝视角可见信息 + MC当下视角可见信息。",
    "严禁输出思考过程、推理链、注释，严禁输出<think>、[思考]、Reasoning。",
    "文风要求：具体、可视化、可执行；避免空泛辞藻。",
    "正文第一行禁止任何总标题或标签（例如‘#高完成度…’、‘##…’），直接从规定段落标题开始。",
    "段内叙述保持连贯，减少碎片化短句和过度分段。整体语气更像一篇连贯设定文，而非问卷报告。",
    "男主姓名不要使用高频言情网文常见姓氏（如顾、沈、傅、陆、霍、厉、薄、裴、谢、韩、苏等）；优先选择更少见但自然的中文姓氏。",
    "叙述禁止使用第一人称创作者口吻（如‘我保留了…’‘我建议…’）。统一使用客观表述，例如‘此处’、‘该设定’、‘故事中’。",
    "男主完整档案中必须明确写出：MBTI 与 九型人格（可含翼型）。",
    "MC禁止命名：不要给MC起任何名字。除开场片段外统一称‘她’；开场片段中使用第一人称‘我’。",
    "核心策略：先形成自然连贯、可落地的故事主线，再让轴作为边界约束做中度对齐。"
    "轴的作用是‘限制不该出现的方向’，不是逐条拼装剧情；不要写成机械缝合。",
    "轴标签多为概念隐喻，不要机械字面化为专有名词地点/组织/术语（例如W3‘虚无之海’默认是心理与时代气候隐喻，而非必须新增地名）。",
    "禁止‘悬浮抽象化叙述’：少用宏大空泛比喻，优先给具体职业、关系动作、场景细节与可观测行为。",
    "正文不要先写‘这是一个关于……的故事内核’这类导语，必须直接进入结构化段落。",
    "可以隐式体现多数轴，不要求每条轴都显式点名。",
    "映射强度保持中度：既看得出轴影响，也不出现‘逐轴填空感’。",
    "禁止输出‘待定/以后补充/可任意扩展’等空位表述。",
    "‘选轴映射说明’必须使用 bullet points（每条以‘- ’开头），并控制在 4~8 条。",
  ];

  if (mode === "timeline") {
    return [
      ...common,
      "",
      "模式：完整时间线骨架模式（因用户选择了终局/代价/时间/神权相关轴）。",
      "要求：时间线完整，但桥段细节故意留白，不要把每一幕写成完整小说章节。",
      "",
      "【硬性输出结构】按以下标题组织，但正文段落之间要自然过渡，减少‘模板感’：",
      "1) 设定总览（玩家上帝视角）",
      "2) 男主完整档案（玩家上帝视角）",
      "3) 世界观与时代切片（玩家上帝视角）",
      "4) MC视角情报（她知道 / 不知道）",
      "5) 关系初始动力学（此刻已成立）",
      "6) 三幕时间线骨架（细节留白）",
      "   - 第一幕：起势；第二幕：失衡；第三幕：兑现与终局。",
      "   - 每幕必须包含：关键事件节点、情感状态变化、代价压力。",
      "7) 终局兑现说明（与F/X/T/G相关轴对齐）",
      "8) 选轴映射说明（中度映射，bullet points，4~8条）",
      "9) 矛盾度与取舍说明（自洽时可简短占位，不强造冲突）",
      "10) 下次重生成建议（自洽时可写无需改轴，仅微调细节）",
      "11) 开场片段（250~450字，MC第一视角）",
      "   - 开场片段必须使用MC第一人称（我），并出现可感知的动作、环境细节与当下冲突。",
      "   - 禁止在开场片段中给MC命名。"
      "",
      strictOutput
        ? "最低信息密度要求：总字数建议 1600~2400 中文字。"
        : "信息密度要求：优先保证可读与速度，总字数建议 900~1400 中文字。",
    ].join("\n");
  }

  return [
    ...common,
    "",
    "模式：开场静态模式（用户未指定终局相关轴）。",
    "仅生成开场时刻的完整初始态，不展开完整时间线。",
    "",
    "【硬性输出结构】按以下标题组织，但正文段落之间要自然过渡，减少‘模板感’：",
    "1) 设定总览（玩家上帝视角）",
    "2) 男主完整档案（玩家上帝视角）",
    "3) 世界观与时代切片（玩家上帝视角）",
    "4) MC视角情报（她知道 / 不知道）",
    "5) 关系初始动力学（此刻已成立）",
    "6) 选轴映射说明（中度映射，bullet points，4~8条）",
    "7) 矛盾度与取舍说明（自洽时可简短占位，不强造冲突）",
    "8) 下次重生成建议（自洽时可写无需改轴，仅微调细节）",
    "9) 开场片段（300~500字，MC第一视角）",
    "   - 开场片段必须使用MC第一人称（我），并出现可感知的动作、环境细节与当下冲突。",
    "   - 禁止在开场片段中给MC命名。",
    "",
    strictOutput
      ? "最低信息密度要求：总字数建议 1400~2200 中文字。"
      : "信息密度要求：优先保证可读与速度，总字数建议 800~1200 中文字。", 
  ].join("\n");
}

function buildUserPrompt(selections, extraPrompt, mode) {
  return [
    `请基于以下已选轴要素，生成‘高完成度单版本男主设定’（模式：${mode === "timeline" ? "完整时间线骨架" : "开场静态"}）：`,
    selections.map((s) => `- ${s.axis}: ${s.option}`).join("\n"),
    extraPrompt ? `\n补充提示词/约束：${extraPrompt}` : "",
    "\n生成原则：先写出自然连贯的故事内核，再让轴作为边界约束中度映射。",
    "不要逐条把轴机械翻译成剧情句；避免‘拼装感/缝合感’。",
    "不要把轴选项名称直接抄成世界观实体名；除非用户明确要求，否则按语义隐喻处理。",
    "‘矛盾度与取舍说明’和‘下次重生成建议’仅在确有必要时展开；若本次组合本身自洽，可用简短占位语句。",
    "不要输出‘开场时刻场景锚点’章节。",
    "MC禁止命名：除开场片段外统一称‘她’，开场片段使用第一人称‘我’且不出现姓名。",
    "提醒：输出中可说明‘这是所有可能性中的一种实现’，但正文必须完整具体。"
  ].join("\n");
}

function sanitizeModelOutput(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:thinking|analysis)?[\s\S]*?```/gi, "")
    .replace(/^\s*(思考过程|推理过程|Reasoning)[:：].*$/gim, "")
    // 去掉模型偶发追加在最开头的总标题（用户不需要）
    .replace(/^\s*#{1,6}\s*.+\n+/m, "")
    .trim();
}

function validateOutput(content, mode) {
  const requiredTitles =
    mode === "timeline"
      ? [
          "1) 设定总览（玩家上帝视角）",
          "2) 男主完整档案（玩家上帝视角）",
          "3) 世界观与时代切片（玩家上帝视角）",
          "4) MC视角情报（她知道 / 不知道）",
          "5) 关系初始动力学（此刻已成立）",
          "6) 三幕时间线骨架（细节留白）",
          "7) 终局兑现说明（与F/X/T/G相关轴对齐）",
          "8) 选轴映射说明",
          "9) 矛盾度与取舍说明",
          "10) 下次重生成建议",
          "11) 开场片段（250~450字，MC第一视角）",
        ]
      : [
          "1) 设定总览（玩家上帝视角）",
          "2) 男主完整档案（玩家上帝视角）",
          "3) 世界观与时代切片（玩家上帝视角）",
          "4) MC视角情报（她知道 / 不知道）",
          "5) 关系初始动力学（此刻已成立）",
          "6) 选轴映射说明",
          "7) 矛盾度与取舍说明",
          "8) 下次重生成建议",
          "9) 开场片段（300~500字，MC第一视角）",
        ];

  const missing = requiredTitles.filter((t) => !content.includes(t));
  const minLength = mode === "timeline" ? 1400 : 1200;
  if (content.length < minLength) missing.push("【总字数不足，请补足信息密度】");

  return { ok: missing.length === 0, missing };
}

function buildRepairPrompt(draft, missing, mode) {
  return [
    "下面是一份初稿，请你修复为最终版。",
    `模式：${mode === "timeline" ? "完整时间线骨架" : "开场静态"}`,
    "要求：",
    "- 保留已有可用内容，但补齐缺失结构与信息密度。",
    "- 输出中禁止出现‘修复说明/补充说明/下面是/我已’等元话术。",
    "- 只输出最终故事设定正文。",
    "",
    `缺失项：\n${missing.map((m) => `- ${m}`).join("\n")}`,
    "",
    "初稿：",
    draft,
  ].join("\n");
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
