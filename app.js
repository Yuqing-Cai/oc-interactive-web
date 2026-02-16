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
  Palette: { desc: "美学滤镜（可选）", options: { "东方古典": "留白克制", "新中式/国潮": "烈度与速度", "西方史诗": "仪式与崇高", "废土写实": "粗粝生存感", "赛博美学": "霓虹与疏离", "哥特/暗黑浪漫": "危险美感", "黑色电影/noir": "谎言与沉迷", "田园治愈": "平凡温柔", "暗黑童话/怪奇": "天真与残酷", "极简留白": "减法叙事" } }
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
  Palette: "调色板是叙事滤镜，不改核心设定但改观感。它决定同一剧情是‘古典克制’还是‘赛博锋利’。当你犹豫风格时，先选Palette。"
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
const savedTheme = localStorage.getItem("oc_theme") || "cyan";
if (themeSelect) {
  themeSelect.value = savedTheme;
  applyTheme(savedTheme);
}

let optionDetailMap = new Map(); // P2 => long text

renderAxes();
updateSelectedCount();
loadDocForExplanations();
initBinaryRain();

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
    localStorage.setItem("oc_theme", v);
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
      <p>${escapeHtml(getOptionLong(item.code, 420))}</p>
    </section>`;
  }).join("");
}

function getOptionLong(code, max = 500) {
  const text = optionDetailMap.get(code) || "该选项暂无对应长文本，已采用系统短解释。";
  return trim(text, max);
}

function trim(text, max) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

async function generate(isRegenerate) {
  const apiUrl = FIXED_API_URL;
  const model = FIXED_MODEL;
  const extraPrompt = extraPromptInput.value.trim();
  const selections = getSelected().map(({ axis, option }) => ({ axis, option }));
  const mode = detectGenerateMode(selections);

  if (selections.length < 3) return setStatus("至少选择 3 项轴要素。", true);

  setLoading(true);
  setStatus(isRegenerate ? `正在重新生成（${mode === "timeline" ? "完整时间线" : "开场静态"}）…` : `正在生成（${mode === "timeline" ? "完整时间线" : "开场静态"}）…`, false);
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selections, model, extraPrompt }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "生成失败");
    resultEl.textContent = data.content;
    setStatus("生成完成。", false);
  } catch (err) {
    setStatus(`错误：${err.message}`, true);
  } finally {
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
  buildRainColumns(sideRainLeft, 7);
  buildRainColumns(sideRainRight, 7);
}

function buildRainColumns(root, count = 6) {
  if (!root) return;
  root.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const col = document.createElement("span");
    col.className = "rain-col";
    col.style.setProperty("--x", `${10 + i * 12}%`);
    col.style.setProperty("--speed", `${9 + Math.random() * 7}s`);
    col.style.setProperty("--delay", `${-Math.random() * 8}s`);
    col.textContent = buildBinaryStream(58);
    root.appendChild(col);
  }
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

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
