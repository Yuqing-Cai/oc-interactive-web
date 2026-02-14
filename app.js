const AXES = {
  W: { desc: "世界阻力：你们的感情会被什么外部环境卡住", options: { "W1 铁律之笼": "规矩大过天（家族/制度/等级）", "W2 废墟之野": "先活下去再谈爱（末日/战乱）", "W3 虚无之海": "日子正常但人心空掉了", "W4 暗面之城": "白天正常，夜里有秘密", "W5 未知之境": "一起闯未知地图", "W6 修罗之场": "你们在同一赛道竞争" } },
  B: { desc: "身体边界：他是什么存在", options: { "B1 凡人身体": "会衰老受伤", "B2 非人身体": "机械/妖灵/异质", "B3 超越肉体": "概念或系统级存在" } },
  P: { desc: "力量类型：他主要靠什么变强", options: { "P1 智力与制度": "靠脑子、资源和规则网络", "P2 肉体与本能": "靠身体素质和战斗本能", "P3 精神与信念": "靠意志力和信念扛住一切" } },
  R: { desc: "立场关系：他如何使用力量", options: { "R1 秩序守卫者": "维护规则", "R2 秩序破坏者": "挑战规则", "R3 被秩序抛弃": "体系外流亡者" } },
  M: { desc: "动机支柱：他为何而活", options: { "M1 外部使命": "被赋予任务", "M2 创伤执念": "被过去劫持", "M3 自发觉醒": "主动选择活与爱", "M4 野心神化": "追逐登顶" } },
  C: { desc: "信念动摇时：他到底怎么选", options: { "C1 坚守至击碎": "先死扛原则，最后被现实打碎", "C2 计算后失灵": "本来很理性，但在你这里算不明白", "C3 无条件选你": "不管后果，第一反应永远是你" } },
  E: { desc: "感情表达方式", options: { "E1 冰山闷骚": "嘴硬手软", "E2 风流撩拨": "语言高手", "E3 直球懵懂": "真诚不过滤", "E4 占有标记": "独占式表达", "E5 照料爹系": "日常细节守护" } },
  J: { desc: "共情能力", options: { "J1 完全不懂": "情感盲区", "J2 努力学习": "笨拙但认真", "J3 比人更懂人": "超越常规定义" } },
  S: { desc: "精神稳定度", options: { "S1 极稳": "冷静如磐石", "S2 有裂痕": "撑着不崩", "S3 已崩坏": "逻辑失序" } },
  D: { desc: "关系权力结构", options: { "D1 他在上位": "高位者低头", "D2 他在下位": "下位者越界", "D3 势均力敌": "对抗式亲密" } },
  V: { desc: "在他眼里，你到底是什么", options: { "V1 你是锚点": "你让他觉得世界是真的", "V2 你是药": "没有你他会失控", "V3 你是劫数": "你是他最大软肋", "V4 你是猎物": "一开始是利用，后来变在乎" } },
  L: { desc: "他爱的是你本人，还是你带来的作用", options: { "L1 爱真实你": "接受你真实且不完美的样子", "L2 爱你的功能": "离不开你能提供的价值", "L3 爱脑补的你": "爱的是他想象中的你" } },
  A: { desc: "致命软肋", options: { "A1 系于一物": "关键载体", "A2 系于一人": "你即开关", "A3 系于一念": "信念崩塌即瓦解" } },
  T: { desc: "时间施加的刀", options: { "T1 寿命差": "预支悲伤", "T2 时间循环": "单向记忆负担", "T3 时空错位": "认知断层", "T4 记忆侵蚀": "渐进遗忘" } },
  G: { desc: "可对抗命运的范围", options: { "G1 个体级": "只能救局部", "G2 规则级": "可改制度", "G3 因果级": "可改世界底层" } },
  X: { desc: "牺牲代价", options: { "X1 降格": "放弃高位属性", "X2 升格": "变强但异化", "X3 湮灭": "自我彻底消失" } },
  F: { desc: "关系终局形态", options: { "F1 融合": "合一不分", "F2 入世": "回归日常", "F3 永隔": "相爱不同界", "F4 轮回": "此生不成来世续" } },
  Palette: { desc: "美学滤镜（可选）", options: { "东方古典": "留白克制", "新中式/国潮": "烈度与速度", "西方史诗": "仪式与崇高", "废土写实": "粗粝生存感", "赛博美学": "霓虹与疏离", "哥特/暗黑浪漫": "危险美感", "黑色电影/noir": "谎言与沉迷", "田园治愈": "平凡温柔", "暗黑童话/怪奇": "天真与残酷", "极简留白": "减法叙事" } }
};

const axisContainer = document.getElementById("axisContainer");
const selectedCountEl = document.getElementById("selectedCount");
const clearBtn = document.getElementById("clearBtn");
const generateBtn = document.getElementById("generateBtn");
const regenBtn = document.getElementById("regenBtn");
const copyBtn = document.getElementById("copyBtn");
const resultEl = document.getElementById("result");
const statusEl = document.getElementById("status");
const apiUrlInput = document.getElementById("apiUrl");
const modelInput = document.getElementById("model");
const extraPromptInput = document.getElementById("extraPrompt");
const selectedExplainEl = document.getElementById("selectedExplain");
const insightPanel = document.getElementById("insightPanel");
const mobileInsightToggle = document.getElementById("mobileInsightToggle");

apiUrlInput.value = localStorage.getItem("oc_api_url") || "";
modelInput.value = localStorage.getItem("oc_model") || "MiniMax-M2.5";

let optionDetailMap = new Map(); // P2 => long text
let axisDetailMap = new Map(); // P => long text

renderAxes();
updateSelectedCount();
loadDocForExplanations();

apiUrlInput.addEventListener("change", () => localStorage.setItem("oc_api_url", apiUrlInput.value.trim()));
modelInput.addEventListener("change", () => localStorage.setItem("oc_model", modelInput.value.trim()));
clearBtn.addEventListener("click", clearSelections);
generateBtn.addEventListener("click", () => generate(false));
regenBtn.addEventListener("click", () => generate(true));
copyBtn.addEventListener("click", copyResult);
mobileInsightToggle.addEventListener("click", () => insightPanel.classList.toggle("open"));

function renderAxes() {
  Object.entries(AXES).forEach(([axisName, cfg]) => {
    const group = document.createElement("section");
    group.className = "axis-group";
    group.dataset.axis = axisName;

    const head = document.createElement("div");
    head.className = "axis-head";
    head.innerHTML = `<h3>${axisName === "Palette" ? "调色板" : `${axisName} 轴`}</h3><span class="chip">${Object.keys(cfg.options).length}项</span>`;

    const desc = document.createElement("p");
    desc.className = "axis-desc";
    desc.textContent = cfg.desc;

    const long = document.createElement("p");
    long.className = "axis-desc axis-long";
    long.dataset.axisLong = axisName;
    long.textContent = "正在加载该轴详细解释...";

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
    group.appendChild(desc);
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

function updateSelectedCount() {
  selectedCountEl.textContent = `已选 ${getSelected().length} 项`;
}

function clearSelections() {
  axisContainer.querySelectorAll("input[type='checkbox']").forEach((input) => (input.checked = false));
  updateSelectedCount();
  renderSelectedExplain([]);
}

function renderSelectedExplain(selected) {
  if (!selected.length) {
    selectedExplainEl.innerHTML = `<p class="muted">还没有选中轴要素。先勾选，右侧会实时显示对应细分解释。</p>`;
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
  const apiUrl = apiUrlInput.value.trim();
  const model = modelInput.value.trim() || "MiniMax-M2.5";
  const extraPrompt = extraPromptInput.value.trim();
  const selections = getSelected().map(({ axis, option }) => ({ axis, option }));

  if (!apiUrl) return setStatus("请先填写 Worker API 地址。", true);
  if (selections.length < 3) return setStatus("至少选择 3 项轴要素。", true);

  setLoading(true);
  setStatus(isRegenerate ? "正在重新生成…" : "正在生成…", false);
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
  statusEl.style.color = isError ? "#ff7b7b" : "#8fa4cf";
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
    axisDetailMap = parsed.axisMap;
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
    const axisLong = axisDetailMap.get(axis) || cfg?.desc || "";
    el.textContent = axisLead(axisLong, cfg?.desc || "");
  });
}

function axisLead(text, fallback = "") {
  const src = (text || "").replace(/\s+/g, " ").trim();
  if (!src) return fallback;

  // 只取前1-2句导读，避免整段砸脸
  const parts = src.split(/(?<=[。！？!?])/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return trim(src, 120);

  const lead = parts.slice(0, 2).join("");
  return trim(lead, 120);
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

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
