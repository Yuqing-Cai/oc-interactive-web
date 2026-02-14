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
        "你是恋爱设定生成器。",
        "目标：仅生成‘男主初始静态状态’，不要写后续剧情推进、轴变化、终局、未来分支。",
        "必须同时给出MC基础身份，但保持模糊可代入，仅写最基础信息。",
        "严禁输出任何思考过程、推理链、解释、注释。严禁输出<think>、[思考]、Reasoning、分析过程。",
        "文风：有画面感但克制，不堆砌辞藻；信息要具体，不要泛泛而谈。",
        "输出结构固定为以下4段标题，且必须按顺序输出：",
        "1) 男主初始状态档案",
        "   - 必须包含：年龄段、外观特征、职业/社会角色、能力来源、行为习惯、禁忌/底线",
        "2) MC基础身份（留白）",
        "   - 仅写3-5条基础信息：年龄段、所处环境、与男主的初始关系位置、一个可代入特征",
        "3) 关系火花起点",
        "   - 只写‘此刻已成立’的关系张力，不写未来剧情",
        "4) 开场场景片段（200-350字）",
      ].join("\\n");

      const userPrompt = [
        "基于以下已选轴要素，生成一个随机但自洽的男主初始设定：",
        selections.map((s) => `- ${s.axis}: ${s.option}`).join("\\n"),
        extraPrompt ? `\\n额外偏好：${extraPrompt}` : "",
      ].join("\\n");

      const upstream = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.95,
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
      const content = sanitizeModelOutput(rawContent);

      if (!content) {
        return json({ error: "No content in model response.", raw: data }, 502);
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
