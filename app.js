const AXIS_LABELS = {
  W: "W = World（世界）",
  B: "B = Body（躯壳）",
  P: "P = Power（力量）",
  R: "R = Role（立场）",
  M: "M = Motive（动机）",
  C: "C = Choice（抉择）",
  E: "E = Expression（表达）",
  J: "J = Judgment（共情）",
  S: "S = Sanity（心智）",
  D: "D = Dynamic（权力）",
  V: "V = View（凝视）",
  L: "L = Love（真伪）",
  A: "A = Achilles（软肋）",
  T: "T = Time（时间）",
  G: "G = God-mode（神权）",
  X: "X = eXchange（代价）",
  F: "F = Finale（终局）",
  Palette: "调色板（美学风格）",
};

const AXES = {
  W: { desc: "世界阻力", options: { "W1 铁律之笼": "规矩大过天（家族/制度/等级）", "W2 废墟之野": "先活下去再谈爱（末日/战乱）", "W3 虚无之海": "日子正常但人心空掉了", "W4 暗面之城": "白天正常，夜里有秘密", "W5 未知之境": "一起闯未知地图", "W6 修罗之场": "你们在同一赛道竞争" } },
  B: { desc: "身体边界", options: { "B1 凡人身体": "会衰老受伤", "B2 非人身体": "机械/妖灵/异质", "B3 超越肉体": "概念或系统级存在" } },
  P: { desc: "力量类型", options: { "P1 智力与制度": "靠脑子、资源和规则网络", "P2 肉体与本能": "靠身体素质和战斗本能", "P3 精神与信念": "靠意志力和信念扛住一切" } },
  R: { desc: "立场关系", options: { "R1 秩序守卫者": "维护规则", "R2 秩序破坏者": "挑战规则", "R3 被秩序抛弃": "体系外流亡者" } },
  M: { desc: "动机支柱", options: { "M1 外部使命": "被赋予任务", "M2 创伤执念": "被过去劫持", "M3 自发觉醒": "主动选择活与爱", "M4 野心神化": "追逐登顶" } },
  C: { desc: "动摇时抉择", options: { "C1 坚守至击碎": "先死扛原则，最后被现实打碎", "C2 计算后失灵": "本来很理性，但在你这里算不明白", "C3 无条件选你": "不管后果，第一反应永远是你" } },
  E: { desc: "感情表达", options: { "E1 冰山闷骚": "嘴硬手软", "E2 风流撩拨": "语言高手", "E3 直球懵懂": "真诚不过滤", "E4 占有标记": "独占式表达", "E5 照料爹系": "日常细节守护" } },
  J: { desc: "共情能力", options: { "J1 完全不懂": "情感盲区", "J2 努力学习": "笨拙但认真", "J3 比人更懂人": "超越常规定义" } },
  S: { desc: "精神状态", options: { "S1 极稳": "冷静如磐石", "S2 有裂痕": "撑着不崩", "S3 已崩坏": "逻辑失序" } },
  D: { desc: "权力结构", options: { "D1 他在上位": "高位者低头", "D2 他在下位": "下位者越界", "D3 势均力敌": "对抗式亲密" } },
  V: { desc: "他的凝视", options: { "V1 你是锚点": "你让他觉得世界是真的", "V2 你是药": "没有你他会失控", "V3 你是劫数": "你是他最大软肋", "V4 你是猎物": "一开始是利用，后来变在乎" } },
  L: { desc: "爱的真伪", options: { "L1 爱真实你": "接受你真实且不完美的样子", "L2 爱你的功能": "离不开你能提供的价值", "L3 爱脑补的你": "爱的是他想象中的你" } },
  A: { desc: "致命软肋", options: { "A1 系于一物": "关键载体", "A2 系于一人": "你即开关", "A3 系于一念": "信念崩塌即瓦解" } },
  T: { desc: "时间残酷", options: { "T1 寿命差": "预支悲伤", "T2 时间循环": "单向记忆负担", "T3 时空错位": "认知断层", "T4 记忆侵蚀": "渐进遗忘" } },
  G: { desc: "神权范围", options: { "G1 个体级": "只能救局部", "G2 规则级": "可改制度", "G3 因果级": "可改世界底层" } },
  X: { desc: "牺牲代价", options: { "X1 降格": "放弃高位属性", "X2 升格": "变强但异化", "X3 湮灭": "自我彻底消失" } },
  F: { desc: "关系终局", options: { "F1 融合": "合一不分", "F2 入世": "回归日常", "F3 永隔": "相爱不同界", "F4 轮回": "此生不成来世续" } },
  Palette: { desc: "美学滤镜（可选）", options: { "东方古典": "诗性留白、克制深情、慢镜头余韵", "新中式/国潮": "高饱和冲击、古今混血、快切张力", "西方史诗": "宏大仪式感、誓言与牺牲并重", "废土写实": "粗粝求生感、资源稀缺下的温柔", "赛博美学": "霓虹冷感外壳下对真实体温的渴望", "哥特/暗黑浪漫": "华丽危险并存、欲望与恐惧缠绕", "黑色电影/noir": "高对比光影、谎言与真心并行", "田园治愈": "日常慢热、劫后余生式安定", "暗黑童话/怪奇": "童真表层下的残酷规则与怪诞温情", "极简留白": "删繁就简、沉默比对白更有信息量" } }
};

const AXIS_GUIDE = {
  W: "W轴决定这段关系先天面对什么外力。它不是背景装饰，而是恋爱成本本身。先定W，你就知道两人最先会被什么卡住。",
  B: "B轴定义他‘能否被触碰’。身体的边界会直接决定亲密方式和脆弱点。很多张力都来自‘想靠近但结构上很难’。",
  P: "P轴是他解决问题的主武器。不同力量类型会改变他的气场，也改变他爱人的方式。你选的不是强弱，而是风格。",
  R: "R轴说的是他站在哪一边。是维护秩序、撕裂秩序，还是被秩序放逐。立场一变，恋爱的伦理压力就完全不同。",
  M: "M轴是他的底层驱动，解释他为什么还在往前走。爱会不会改变他，先看这根支柱有多硬。它决定关系冲突的‘深度’。",
  C: "C轴是压力测试：当爱和原则冲突，他到底选什么。这个轴直接决定角色的戏剧爆点。也是最能看出人设锋利度的一轴。",
  E: "E轴是读者最直观能感到的‘恋爱手感’。同样是爱，有人靠行动，有人靠语言，有人靠占有。它决定你们互动的温度与刺感。",
  J: "J轴决定他处理情绪的能力。懂不懂人心，会影响误伤频率和沟通成本。很多甜虐都从这里生长出来。",
  S: "S轴是稳定性，不是简单好坏。越不稳定越有爆发力，但也越危险。它决定关系是慢火、带伤，还是高风险。",
  D: "D轴定义谁在关系里更有控制力。权力差会制造禁忌和吸引，也会制造不平等风险。先想清楚这个轴，关系才不会漂。",
  V: "V轴是他看你的镜头。你是锚、药、劫，还是猎物，决定他靠近你的动机。这个轴常常比‘他说爱你’更真实。",
  L: "L轴回答一个残酷问题：他爱的是你，还是你提供的功能。这个轴决定关系是否能走向成熟。也是后续成长弧线的核心。",
  A: "A轴给角色一个真实可击中的弱点。没有软肋的人很强，但不动人。软肋落在哪里，剧情刀口就落在哪里。",
  T: "T轴是命运的压力源。它会让‘相爱’变成一件有时限、有代价的事。时间一进场，情感重量会立刻上升。",
  G: "G轴是他对抗命运的权限级别。权限越高，代价和副作用通常越大。这个轴负责控制‘爽度’和‘灾难感’的平衡。",
  X: "X轴写的是他最终付出了什么。牺牲不是点缀，而是价值排序。失去什么，决定这段关系最终像什么。",
  F: "F轴是关系最终形态。它不是单纯HE/BE，而是你希望这段爱停在什么温度。选F时，最好和X轴一起看。",
  Palette: "调色板是‘镜头与美术层’，和内容轴正交。它不改变核心设定，但会改变读者感到的温度、速度和压迫感。可把它理解成同一故事的不同拍法。"
};

const PALETTE_LONG = {
  "东方古典": "关键词：水墨、月光、屏风、留白。强调‘不直说’的情绪推进，擅长写克制深情与命运遗憾；一个眼神和一次停顿就能承载大情感。",
  "新中式/国潮": "关键词：朱砂、鎏金、快切、锐度。保留东方骨架但注入现代节奏与视觉冲击，适合高张力、强冲突、镜头感很强的关系线。",
  "西方史诗": "关键词：教堂、战旗、誓言、编年史。放大崇高感与仪式感，适合写‘值得被历史记住’的爱情与牺牲。",
  "废土写实": "关键词：锈铁、尘沙、绷带、配给。环境越恶劣，微小善意越动人；适合绝境相依、资源稀缺下的忠诚与珍惜。",
  "赛博美学": "关键词：霓虹、阴雨、义体、广告海。外部世界越虚假冷硬，越凸显‘真实触碰’的珍贵；适合写疏离与渴望并存。",
  "哥特/暗黑浪漫": "关键词：烛光、古堡、荆棘、血色玫瑰。美与危险同场，安全感与恐惧感共存，适合禁忌吸引与高风险亲密。",
  "黑色电影/noir": "关键词：高反差光影、烟雾、雨巷、谎言。每句话都可能有双层含义，适合猜忌中的激情和‘互骗却互信’的关系。",
  "田园治愈": "关键词：阳光、风铃、厨房、日常。以慢节奏和细碎生活承载深情，适合‘风暴之后终于安稳’的关系体验。",
  "暗黑童话/怪奇": "关键词：森林、面具、会说话的骨头。用天真外壳包裹残酷逻辑，适合怪诞规则下的温柔与保护欲。",
  "极简留白": "关键词：沉默、白色空间、减法叙事。去掉华丽修饰，只保留核心动作与情绪余波；适合高级克制、后劲很强的文本。",
};

const axisContainer = document.getElementById("axisContainer");
const selectedCountEl = document.getElementById("selectedCount");
const clearBtn = document.getElementById("clearBtn");
const clearBtnBottom = document.getElementById("clearBtnBottom");
const modeBadgeEl = document.getElementById("modeBadge");
const generateBtn = document.getElementById("generateBtn");
const regenBtn = document.getElementById("regenBtn");
const copyBtn = document.getElementById("copyBtn");
const resultEl = document.getElementById("result");
const resultPanelEl = document.getElementById("resultPanel");
const thinkingPanelEl = document.getElementById("thinkingPanel");
const thinkingSummaryEl = document.getElementById("thinkingSummary");
const thinkingContentEl = document.getElementById("thinkingContent");
const statusEl = document.getElementById("status");
const extraPromptInput = document.getElementById("extraPrompt");
const selectedExplainEl = document.getElementById("selectedExplain");
const insightPanel = document.getElementById("insightPanel");
const mobileInsightToggle = document.getElementById("mobileInsightToggle");
const themeSelect = document.getElementById("themeSelect");
const sideRainLeft = document.getElementById("sideRainLeft");
const sideRainRight = document.getElementById("sideRainRight");

const FIXED_API_URL = "https://oc-interactive-web-api.lnln2004.workers.dev/generate";
const FIXED_MODEL = "MiniMax-M2.5";
const defaultTheme = "cyan";
if (themeSelect) {
  themeSelect.value = defaultTheme;
  applyTheme(defaultTheme);
}

let optionDetailMap = new Map(); // P2 => long text
let rainStreams = [];
let rainRafId = 0;
let rainLastTs = 0;


renderAxes();
updateSelectedCount();
loadDocForExplanations();
initBinaryRain();

if (extraPromptInput) extraPromptInput.value = "";
window.addEventListener("pageshow", () => {
  if (extraPromptInput) extraPromptInput.value = "";
});

clearBtn.addEventListener("click", clearSelections);
if (clearBtnBottom) clearBtnBottom.addEventListener("click", clearSelections);
generateBtn.addEventListener("click", () => generate(false));
regenBtn.addEventListener("click", () => generate(true));
copyBtn.addEventListener("click", copyResult);
mobileInsightToggle.addEventListener("click", () => {
  insightPanel.classList.toggle("open");
  syncMobileToggle();
});
window.addEventListener("resize", syncMobileToggle);
syncMobileToggle();
if (themeSelect) {
  themeSelect.addEventListener("change", () => {
    const v = themeSelect.value;
    applyTheme(v);
  });
}

function renderAxes() {
  Object.entries(AXES).forEach(([axisName, cfg]) => {
    const group = document.createElement("section");
    group.className = "axis-group";
    group.dataset.axis = axisName;

    const head = document.createElement("div");
    head.className = "axis-head";
    head.innerHTML = `<h3>${AXIS_LABELS[axisName] || axisName}</h3><span class="chip">${Object.keys(cfg.options).length}项</span>`;

    const long = document.createElement("p");
    long.className = "axis-desc axis-long";
    long.dataset.axisLong = axisName;
    long.textContent = AXIS_GUIDE[axisName] || cfg.desc;

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "options";

    Object.entries(cfg.options).forEach(([opt, detail], index) => {
      const id = `${axisName}-${index}`;
      const code = getCode(opt);
      const label = document.createElement("label");
      label.className = "option-item";
      label.innerHTML = `<div class="option-name"><input type="checkbox" data-axis="${axisName}" data-code="${code}" value="${opt}" id="${id}" /><span>${opt}</span></div><div class="option-desc">${detail}</div>`;
      optionsWrap.appendChild(label);
    });

    group.appendChild(head);
    group.appendChild(long);
    group.appendChild(optionsWrap);
    axisContainer.appendChild(group);
  });

  axisContainer.addEventListener("change", (e) => {
    if (e.target?.matches("input[type='checkbox']") && e.target.checked) {
      enforceSingleSelection(e.target);
    }
    updateSelectedCount();
    renderSelectedExplain(getSelected());
  });
}

function enforceSingleSelection(target) {
  const axis = target.dataset.axis;
  axisContainer.querySelectorAll(`input[type='checkbox'][data-axis='${axis}']`).forEach((cb) => {
    if (cb !== target) cb.checked = false;
  });
}

function getSelected() {
  return Array.from(axisContainer.querySelectorAll("input[type='checkbox']:checked")).map((item) => ({ axis: item.dataset.axis, option: item.value, code: item.dataset.code }));
}

function detectGenerateMode(selected = getSelected()) {
  const axes = new Set(selected.map((s) => String(s.axis || "").trim().toUpperCase()));
  return (axes.has("F") || axes.has("X") || axes.has("T") || axes.has("G")) ? "timeline" : "opening";
}

function updateSelectedCount() {
  const selected = getSelected();
  selectedCountEl.textContent = `已选 ${selected.length} 项`;
  if (modeBadgeEl) {
    modeBadgeEl.textContent = `模式：${detectGenerateMode(selected) === "timeline" ? "完整时间线" : "开场静态"}`;
  }
}

function clearSelections() {
  axisContainer.querySelectorAll("input[type='checkbox']").forEach((input) => (input.checked = false));
  updateSelectedCount();
  renderSelectedExplain([]);
}

function renderSelectedExplain(selected) {
  if (!selected.length) {
    selectedExplainEl.innerHTML = `<p class="muted">还没有选中轴要素。先勾选，此处会显示对应细分解释。</p>`;
    return;
  }

  selectedExplainEl.innerHTML = selected.map((item) => {
    const short = AXES[item.axis]?.options?.[item.option] || "";
    return `<section class="explain-card">
      <h4>${escapeHtml(item.option)}</h4>
      ${short ? `<p><strong>速览：</strong>${escapeHtml(short)}</p>` : ""}
      <p>${escapeHtml(getOptionLong(item.code, 560))}</p>
    </section>`;
  }).join("");
}

function getOptionLong(code, max = 500) {
  const text = optionDetailMap.get(code) || PALETTE_LONG[code] || "该选项暂无对应长文本，已采用系统短解释。";
  return trim(text, max);
}

function trim(text, max) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

async function generate(isRegenerate) {
  const apiUrl = FIXED_API_URL;
  const streamUrl = apiUrl.replace(/\/generate$/, "/generate-stream");
  const model = FIXED_MODEL;
  const extraPrompt = extraPromptInput.value.trim();
  const selections = getSelected().map(({ axis, option }) => ({ axis, option }));
  const mode = detectGenerateMode(selections);

  if (selections.length < 3) return setStatus("至少选择 3 项轴要素。", true);

  setLoading(true);
  const startedAt = performance.now();
  const modeLabel = mode === "timeline" ? "完整时间线" : "开场静态";
  const actionLabel = isRegenerate ? "正在重新生成" : "正在生成";

  if (resultPanelEl) resultPanelEl.open = true;
  if (thinkingPanelEl) thinkingPanelEl.open = true;
  if (thinkingSummaryEl) thinkingSummaryEl.textContent = "系统状态（实时同步中）";

  const liveTrace = [];
  const updateProgress = () => {
    const elapsedMs = Math.max(100, performance.now() - startedAt);
    const seconds = elapsedMs / 1000;
    setStatus(`${actionLabel}（${modeLabel}，已运行 ${seconds.toFixed(1)} 秒）…`, false);

    if (!thinkingContentEl) return;
    if (!liveTrace.length) {
      thinkingContentEl.innerHTML = `<div class="trace-log">
        <div class="trace-item"><span class="trace-time">进行中</span><span class="trace-text">请求已发送，等待服务端阶段回传…</span></div>
      </div>`;
      return;
    }

    thinkingContentEl.innerHTML = formatTrace(liveTrace, false, mode, elapsedMs, {}, elapsedMs);
  };

  updateProgress();
  const timer = setInterval(updateProgress, 500);

  try {
    const requestCtrl = new AbortController();
    // 不再在前端做硬超时中断，避免把长生成误判为失败。
    // 若需手动中止，后续可增加“取消生成”按钮来触发 requestCtrl.abort()。

    const response = await fetch(streamUrl, {
      method: "POST",
      body: JSON.stringify({ selections, model, extraPrompt }),
      signal: requestCtrl.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `HTTP ${response.status}`);
    }

    if (!response.body) throw new Error("流式响应不可用。");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalContent = "";
    let finalMeta = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const block of parts) {
        const line = block.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;

        let evt = null;
        try {
          evt = JSON.parse(line.slice(5).trim());
        } catch {
          continue;
        }

        if (evt?.type === "stage") {
          liveTrace.push({ stage: evt.stage, t: evt.t || 0 });
          if (thinkingContentEl) {
            const elapsedMs = Math.max(100, performance.now() - startedAt);
            thinkingContentEl.innerHTML = formatTrace(liveTrace, false, mode, elapsedMs, {}, elapsedMs);
          }
        } else if (evt?.type === "ping") {
          // 心跳包：用于保持流连接活性，前端无需额外渲染。
        } else if (evt?.type === "done") {
          finalContent = evt.content || "";
          finalMeta = evt.meta || null;
        } else if (evt?.type === "error") {
          throw new Error(evt.error || "流式生成失败");
        }
      }
    }

    if (!finalContent) throw new Error("服务端未返回最终内容。请重试。");

    resultEl.innerHTML = renderResultContent(finalContent);
    const seconds = Math.max(0.1, (performance.now() - startedAt) / 1000);
    setStatus(`生成完成（已运行 ${seconds.toFixed(1)} 秒）。`, false);

    if (thinkingSummaryEl) thinkingSummaryEl.textContent = `系统状态（已完成，用时 ${seconds.toFixed(1)} 秒）`;
    if (thinkingContentEl) {
      thinkingContentEl.innerHTML = formatTrace(
        finalMeta?.trace || liveTrace,
        finalMeta?.repaired,
        finalMeta?.mode || mode,
        finalMeta?.totalMs,
        { finalModel: finalMeta?.finalModel, fallbackUsed: finalMeta?.fallbackUsed }
      );
    }

    if (thinkingPanelEl) thinkingPanelEl.open = true;
    if (resultPanelEl) resultPanelEl.open = true;
  } catch (err) {
    const msg = err?.name === "AbortError"
      ? "请求已中止。若非你主动取消，通常是浏览器/网络中间层断开了长连接，请重试。"
      : (err?.name === "TypeError"
        ? "网络层请求失败（可能是边缘连接被中断/跨域链路异常，并不一定是你本地断网）。请重试。"
        : (err?.message || "未知错误"));
    setStatus(`错误：${msg}`, true);
    if (thinkingSummaryEl) thinkingSummaryEl.textContent = "系统状态（生成失败）";
    if (thinkingContentEl) thinkingContentEl.textContent = `- 请求失败\n- ${msg}`;
    if (thinkingPanelEl) thinkingPanelEl.open = true;
  } finally {
    clearInterval(timer);
    setLoading(false);
  }
}

function setLoading(loading) {
  generateBtn.disabled = loading;
  regenBtn.disabled = loading;
}

function setStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "var(--status-error)" : "var(--status-ok)";
}

function formatTrace(trace = [], repaired = false, mode = "", totalMs = 0, extra = {}, elapsedMs = 0) {
  const labelMap = {
    request_received: "收到生成请求",
    mode_decided: "确定生成模式",
    upstream_request_started: "向模型发起请求",
    upstream_timeout: "主模型超时（若配置了降级模型将重试）",
    fallback_request_started: "已切换快速模型重试",
    fallback_response_received: "快速模型返回结果",
    upstream_response_received: "收到模型初稿",
    output_validated: "完成结构校验",
    repair_started: "触发自动修复",
    repair_applied: "已应用修复结果",
    repair_empty: "修复返回空内容（已忽略）",
    repair_failed: "修复请求失败",
    repair_skipped: "无需修复",
    upstream_error: "模型请求失败",
    completed: "生成流程完成",
  };

  const items = Array.isArray(trace) ? trace : [];
  let rows = items.length
    ? items
        .map((item) => {
          const sec = (Number(item.t || 0) / 1000).toFixed(1);
          const label = escapeHtml(labelMap[item.stage] || item.stage || "未知阶段");
          return `<div class="trace-item"><span class="trace-time">${sec}s</span><span class="trace-text">${label}</span></div>`;
        })
        .join("")
    : `<div class="trace-item"><span class="trace-time">-</span><span class="trace-text">模型阶段日志不可用</span></div>`;

  const last = items.at(-1);
  const done = last?.stage === "completed";
  const liveMs = elapsedMs || totalMs || Number(last?.t || 0);
  if (last && !done && liveMs > Number(last.t || 0)) {
    const nowSec = (liveMs / 1000).toFixed(1);
    const runningFor = ((liveMs - Number(last.t || 0)) / 1000).toFixed(1);
    const runningLabel = last.stage === "upstream_request_started"
      ? `模型生成中（已持续 ${runningFor}s）`
      : `阶段进行中（已持续 ${runningFor}s）`;
    rows += `<div class="trace-item"><span class="trace-time">${nowSec}s</span><span class="trace-text">${escapeHtml(runningLabel)}</span></div>`;
  }

  const timingRows = items.length > 1
    ? items.slice(1).map((item, idx) => {
        const prev = Number(items[idx]?.t || 0);
        const cur = Number(item.t || 0);
        const cost = Math.max(0, (cur - prev) / 1000).toFixed(2);
        const label = escapeHtml(labelMap[item.stage] || item.stage || "未知阶段");
        return `<tr><td style="padding:1px 0;">${label}</td><td style="text-align:right;padding:1px 0;">${cost}s</td></tr>`;
      }).join("")
    : "";

  const timingTable = timingRows
    ? `<div style="margin:6px 0 4px 0;">
        <div style="font-size:12px;opacity:.85;margin-bottom:3px;">阶段耗时拆解</div>
        <table style="width:100%;font-size:12px;line-height:1.2;border-collapse:collapse;">
          <thead><tr><th style="text-align:left;opacity:.7;padding:0 0 2px 0;">阶段</th><th style="text-align:right;opacity:.7;padding:0 0 2px 0;">耗时</th></tr></thead>
          <tbody>${timingRows}</tbody>
        </table>
      </div>`
    : "";

  const totalSec = totalMs
    ? (totalMs / 1000).toFixed(1)
    : (Number(items.at(-1)?.t || 0) / 1000).toFixed(1);

  return `<div class="trace-log">${rows}</div>${timingTable}
    <div class="trace-meta">
      <div>自动修复：${repaired ? "触发" : "未触发"}</div>
      <div>模式：${escapeHtml(mode || "未知")}</div>
      <div>实际模型：${escapeHtml(extra?.finalModel || FIXED_MODEL)}</div>
      <div>降级重试：${extra?.fallbackUsed ? "是" : "否"}</div>
      <div>总耗时：${totalSec} 秒</div>
    </div>`;
}

async function copyResult() {
  const text = resultEl.textContent?.trim();
  if (!text) return setStatus("当前没有可复制内容。", true);
  try {
    await navigator.clipboard.writeText(text);
    setStatus("已复制到剪贴板。", false);
  } catch {
    setStatus("复制失败，请手动复制。", true);
  }
}

async function loadDocForExplanations() {
  try {
    const md = await fetch("./OC.md").then((r) => r.text());
    const parsed = parseDoc(md);
    optionDetailMap = parsed.optionMap;
    hydrateAxisLongDescriptions();
    renderSelectedExplain(getSelected());
  } catch {
    renderSelectedExplain(getSelected());
  }
}

function hydrateAxisLongDescriptions() {
  document.querySelectorAll("[data-axis-long]").forEach((el) => {
    const axis = el.dataset.axisLong;
    const cfg = AXES[axis];
    el.textContent = AXIS_GUIDE[axis] || cfg?.desc || "";
  });
}

function parseDoc(md) {
  const lines = md.split("\n");
  const optionMap = new Map();
  const axisMap = new Map();

  let currentAxis = null;
  let axisBuffer = [];
  let seenOptionInAxis = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    const axisHead = /^###\s+([A-Z])\s*=/.exec(line);
    if (axisHead) {
      if (currentAxis && axisBuffer.length) {
        axisMap.set(currentAxis, cleanMarkdown(axisBuffer.join("\n")));
      }
      currentAxis = axisHead[1];
      axisBuffer = [];
      seenOptionInAxis = false;
      continue;
    }

    const opt = /^\*\*([A-Z]\d)[:：]\s*([^*]+)\*\*$/.exec(line);
    if (opt) {
      seenOptionInAxis = true;
      const code = opt[1];
      const buf = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        const n = lines[j].trim();
        if (/^\*\*([A-Z]\d)[:：]\s*([^*]+)\*\*$/.test(n) || /^###\s+[A-Z]\s*=/.test(n) || /^##\s+/.test(n)) break;
        if (n === "---") continue;
        buf.push(lines[j]);
      }
      optionMap.set(code, cleanMarkdown(buf.join("\n")));
      i = j - 1;
      continue;
    }

    if (currentAxis && !seenOptionInAxis && line) {
      axisBuffer.push(raw);
    }
  }

  if (currentAxis && axisBuffer.length) {
    axisMap.set(currentAxis, cleanMarkdown(axisBuffer.join("\n")));
  }
  return { optionMap, axisMap };
}

function getCode(optionLabel = "") {
  const m = /^([A-Z]\d)/.exec(optionLabel.trim());
  return m ? m[1] : optionLabel;
}

function cleanMarkdown(str) {
  return str
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\|.*\|\s*$/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^\s*---\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function initBinaryRain() {
  rainStreams = [];
  buildRainColumns(sideRainLeft, 7);
  buildRainColumns(sideRainRight, 7);
  if (rainRafId) cancelAnimationFrame(rainRafId);
  rainLastTs = 0;
  rainRafId = requestAnimationFrame(tickBinaryRain);
}

function buildRainColumns(root, count = 6) {
  if (!root) return;
  root.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const x = 10 + i * 12;
    for (let j = 0; j < 2; j++) {
      const col = document.createElement("span");
      col.className = "rain-col";
      col.style.setProperty("--x", `${x}%`);
      col.textContent = buildBinaryStream(76);
      root.appendChild(col);

      rainStreams.push({
        el: col,
        y: -260 + Math.random() * 460, // percent range, includes offscreen
        speed: 36 + Math.random() * 34, // percent / sec
      });
    }
  }
}

function tickBinaryRain(ts) {
  if (!rainLastTs) rainLastTs = ts;
  const dt = Math.min(0.05, (ts - rainLastTs) / 1000);
  rainLastTs = ts;

  for (const stream of rainStreams) {
    stream.y += stream.speed * dt;
    if (stream.y > 240) {
      stream.y = -320 - Math.random() * 160;
      stream.speed = 36 + Math.random() * 34;
      if (Math.random() > 0.5) stream.el.textContent = buildBinaryStream(76);
    }
    stream.el.style.transform = `translate3d(0, ${stream.y}%, 0)`;
  }

  rainRafId = requestAnimationFrame(tickBinaryRain);
}

function buildBinaryStream(lines = 52) {
  let out = "";
  for (let i = 0; i < lines; i++) {
    out += Math.random() > 0.5 ? "1" : "0";
    if (i < lines - 1) out += "\n";
  }
  return out;
}

function applyTheme(name) {
  document.body.classList.remove("theme-green", "theme-yellow", "theme-pink", "theme-red", "theme-purple", "theme-orange");
  if (name && name !== "cyan") document.body.classList.add(`theme-${name}`);
}

function syncMobileToggle() {
  if (!mobileInsightToggle || !insightPanel) return;
  const isMobile = window.matchMedia("(max-width: 1100px)").matches;
  if (!isMobile) {
    insightPanel.classList.remove("open");
    mobileInsightToggle.textContent = "查看解释面板";
    return;
  }
  mobileInsightToggle.textContent = insightPanel.classList.contains("open") ? "收起解释面板" : "查看解释面板";
}

function renderResultContent(text = "") {
  const lines = String(text).split("\n");
  return lines
    .map((raw) => {
      const line = raw.trimEnd();
      if (!line.trim()) return `<div class="result-line result-blank"></div>`;

      if (/^#{1,6}\s+/.test(line)) {
        const title = line.replace(/^#{1,6}\s+/, "");
        return `<h4 class="result-title">${renderInlineMarkdown(title)}</h4>`;
      }

      if (/^\*\*\s*\d+\)\s+.*\*\*$/.test(line)) {
        const title = line.replace(/^\*\*\s*/, "").replace(/\*\*$/, "");
        return `<h4 class="result-title">${renderInlineMarkdown(title)}</h4>`;
      }

      if (/^\d+\)\s+/.test(line)) {
        return `<h4 class="result-title">${renderInlineMarkdown(line)}</h4>`;
      }

      if (/^[-*]\s+/.test(line)) {
        return `<div class="result-line result-bullet">${renderInlineMarkdown(line)}</div>`;
      }

      return `<div class="result-line">${renderInlineMarkdown(line)}</div>`;
    })
    .join("");
}

function renderInlineMarkdown(input = "") {
  const escaped = escapeHtml(input);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
