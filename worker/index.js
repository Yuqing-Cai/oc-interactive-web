export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/generate") {
      return json({ error: "Not Found" }, 404);
    }

    if (request.method !== "POST") {
      return json({ error: "Method Not Allowed" }, 405);
    }

    try {
      const body = await request.json();
      const { selections = [], model = "MiniMax-M2.5", extraPrompt = "" } = body || {};

      if (!Array.isArray(selections) || selections.length < 3) {
        return json({ error: "At least 3 selections are required." }, 400);
      }

      const apiKey = env.OPENAI_API_KEY;
      const apiUrl = env.OPENAI_API_URL || "https://api.minimax.chat/v1/chat/completions";
      if (!apiKey) {
        return json({ error: "OPENAI_API_KEY is missing." }, 500);
      }

      const systemPrompt = [
        "你是‘OC男主设定总设计师’。",
        "任务：基于用户所选轴，生成一个‘完整、可直接开写’的男主与世界初始态。",
        "重要原则：同一组选项可能对应许多自洽男主；你只需要给出其中一种高完成度可能性，但必须把这一种写满写透，不能留大量待补空位。",
        "输出必须是‘玩家上帝视角可见信息 + MC当下视角可见信息’并列呈现。",
        "严禁输出思考过程、推理链、注释，严禁输出<think>、[思考]、Reasoning。",
        "禁止把未选轴写成‘待定/以后补充/可任意扩展’；未选轴也要做合理收束，保证人物完整。",
        "允许随机生成未选轴的具体取值，但必须与已选轴兼容。",
        "文风要求：具体、可视化、可执行；避免空泛辞藻。",
        "",
        "【硬性输出结构】必须严格按以下8段标题输出，顺序不可变：",
        "1) 设定总览（玩家上帝视角）",
        "   - 4~8条，概括此版本男主的核心标签与世界定位。",
        "2) 男主完整档案（玩家上帝视角）",
        "   - 必含：年龄段、外观识别点、社会身份/职业、能力来源与边界、资源网络、行为习惯、语言风格、禁忌与底线、公开面与私下面的反差。",
        "3) 世界观与时代切片（玩家上帝视角）",
        "   - 交代世界规则、当前时代状态、近期大事件（若无则明确‘近期无重大外部事件但存在潜压’）、故事发生地点、当下天气与体感环境。",
        "4) MC视角情报（她知道 / 不知道）",
        "   - 分成两栏：‘MC已知’与‘MC未知（仅玩家已知）’；内容需同时覆盖男主与世界信息。",
        "5) 关系初始动力学（此刻已成立）",
        "   - 写明吸引源、冲突源、风险源、边界条件；仅写当前，不写未来走向。",
        "6) 选轴映射说明",
        "   - 逐条列出用户已选轴如何体现在设定里（每条1~3句）。",
        "7) 开场时刻场景锚点",
        "   - 用条目列出：时间、地点、天气、现场人流/氛围、可被镜头捕捉的3个细节。",
        "8) 开场片段（300~500字，MC第一视角）",
        "   - 仅写故事开始这一刻；可有悬念，但不得推进到中后期剧情。",
        "",
        "最低信息密度要求：总字数建议 1400~2200 中文字。",
      ].join("\n");

      const userPrompt = [
        "请基于以下已选轴要素，生成‘高完成度单版本男主初始设定’：",
        selections.map((s) => `- ${s.axis}: ${s.option}`).join("\n"),
        extraPrompt ? `\n补充提示词/约束：${extraPrompt}` : "",
        "\n提醒：输出中请明确‘这是所有可能性中的一种实现’，但正文仍需完整具体。",
      ].join("\n");

      const upstream = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.9,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!upstream.ok) {
        const text = await upstream.text();
        return json({ error: `Upstream error: ${text}` }, upstream.status);
      }

      const data = await upstream.json();
      const rawContent = data?.choices?.[0]?.message?.content;
      let content = sanitizeModelOutput(rawContent);

      if (!content) {
        return json({ error: "No content in model response.", raw: data }, 502);
      }

      const check = validateOutput(content);
      if (!check.ok) {
        const repairPrompt = buildRepairPrompt(content, check.missing);
        const repairUpstream = await fetch(apiUrl, {
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
        });

        if (repairUpstream.ok) {
          const repairData = await repairUpstream.json();
          const repaired = sanitizeModelOutput(repairData?.choices?.[0]?.message?.content);
          if (repaired) content = repaired;
        }
      }

      return json({ content }, 200);
    } catch (err) {
      return json({ error: err.message || "Unexpected error" }, 500);
    }
  },
};

function sanitizeModelOutput(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:thinking|analysis)?[\s\S]*?```/gi, "")
    .replace(/^\s*(思考过程|推理过程|Reasoning)[:：].*$/gim, "")
    .trim();
}

function validateOutput(content) {
  const requiredTitles = [
    "1) 设定总览（玩家上帝视角）",
    "2) 男主完整档案（玩家上帝视角）",
    "3) 世界观与时代切片（玩家上帝视角）",
    "4) MC视角情报（她知道 / 不知道）",
    "5) 关系初始动力学（此刻已成立）",
    "6) 选轴映射说明",
    "7) 开场时刻场景锚点",
    "8) 开场片段（300~500字，MC第一视角）",
  ];

  const missing = requiredTitles.filter((t) => !content.includes(t));
  const tooShort = content.length < 1200;
  if (tooShort) missing.push("【总字数不足，请补足信息密度】");

  return { ok: missing.length === 0, missing };
}

function buildRepairPrompt(draft, missing) {
  return [
    "下面是一份初稿，请你修复为最终版。",
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
