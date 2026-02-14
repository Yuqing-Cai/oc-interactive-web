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
        "目标：仅生成‘男主初始静态状态’，不要写后续剧情推进、轴变化、结局。",
        "必须同时给出MC基础身份，但保持模糊可代入，仅写最基础信息。",
        "文风：有画面感但克制，不堆砌辞藻。",
        "输出结构固定为以下4段标题：",
        "1) 男主初始状态档案",
        "2) MC基础身份（留白）",
        "3) 关系火花起点",
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
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        return json({ error: "No content in model response.", raw: data }, 502);
      }

      return json({ content }, 200);
    } catch (err) {
      return json({ error: err.message || "Unexpected error" }, 500);
    }
  },
};

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
