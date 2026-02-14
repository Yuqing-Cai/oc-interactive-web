const AXES = {
  W: { desc: "世界阻力：你们要对抗的外部环境", options: { "W1 铁律之笼": "规训社会/等级体系", "W2 废墟之野": "生存优先的崩坏世界", "W3 虚无之海": "精神层面的空洞", "W4 暗面之城": "表里双面、暗流涌动", "W5 未知之境": "共同探索未知", "W6 修罗之场": "零和竞争场" } },
  B: { desc: "身体边界：他是什么存在", options: { "B1 凡人身体": "会衰老受伤", "B2 非人身体": "机械/妖灵/异质", "B3 超越肉体": "概念或系统级存在" } },
  P: { desc: "力量类型：他的核心能量", options: { "P1 智力与制度": "资源/信息/规则能力", "P2 肉体与本能": "武力/本能/战斗", "P3 精神与信念": "意志与灵魂强度" } },
  R: { desc: "立场关系：他如何使用力量", options: { "R1 秩序守卫者": "维护规则", "R2 秩序破坏者": "挑战规则", "R3 被秩序抛弃": "体系外流亡者" } },
  M: { desc: "动机支柱：他为何而活", options: { "M1 外部使命": "被赋予任务", "M2 创伤执念": "被过去劫持", "M3 自发觉醒": "主动选择活与爱", "M4 野心神化": "追逐登顶" } },
  C: { desc: "信念动摇时的反应", options: { "C1 坚守至击碎": "先抗拒后崩裂", "C2 计算后失灵": "理性体系被爱击穿", "C3 无条件选你": "本能优先于规则" } },
  E: { desc: "感情表达方式", options: { "E1 冰山闷骚": "嘴硬手软", "E2 风流撩拨": "语言高手", "E3 直球懵懂": "真诚不过滤", "E4 占有标记": "独占式表达", "E5 照料爹系": "日常细节守护" } },
  J: { desc: "共情能力", options: { "J1 完全不懂": "情感盲区", "J2 努力学习": "笨拙但认真", "J3 比人更懂人": "超越常规定义" } },
  S: { desc: "精神稳定度", options: { "S1 极稳": "冷静如磐石", "S2 有裂痕": "撑着不崩", "S3 已崩坏": "逻辑失序" } },
  D: { desc: "关系权力结构", options: { "D1 他在上位": "高位者低头", "D2 他在下位": "下位者越界", "D3 势均力敌": "对抗式亲密" } },
  V: { desc: "他如何看你", options: { "V1 你是锚点": "唯一真实", "V2 你是药": "依赖性救赎", "V3 你是劫数": "失控源头", "V4 你是猎物": "从利用到在乎" } },
  L: { desc: "爱的真伪", options: { "L1 爱真实你": "穿透滤镜", "L2 爱你的功能": "工具性依赖", "L3 爱脑补的你": "想象投射" } },
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
const docSearchInput = document.getElementById("docSearch");
const docTocEl = document.getElementById("docToc");
const docContentEl = document.getElementById("docContent");

apiUrlInput.value = localStorage.getItem("oc_api_url") || "";
modelInput.value = localStorage.getItem("oc_model") || "MiniMax-M2.5";

renderAxes();
updateSelectedCount();
loadDoc();

apiUrlInput.addEventListener("change", () => localStorage.setItem("oc_api_url", apiUrlInput.value.trim()));
modelInput.addEventListener("change", () => localStorage.setItem("oc_model", modelInput.value.trim()));
clearBtn.addEventListener("click", clearSelections);
generateBtn.addEventListener("click", () => generate(false));
regenBtn.addEventListener("click", () => generate(true));
copyBtn.addEventListener("click", copyResult);
docSearchInput.addEventListener("input", () => filterDoc(docSearchInput.value.trim()));

function renderAxes() {
  Object.entries(AXES).forEach(([axisName, cfg]) => {
    const group = document.createElement("section");
    group.className = "axis-group";

    const head = document.createElement("div");
    head.className = "axis-head";
    head.innerHTML = `<h3>${axisName === "Palette" ? "调色板" : `${axisName} 轴`}</h3><span class="chip">${Object.keys(cfg.options).length}项</span>`;
    group.appendChild(head);

    const desc = document.createElement("p");
    desc.className = "axis-desc";
    desc.textContent = cfg.desc;
    group.appendChild(desc);

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "options";

    Object.entries(cfg.options).forEach(([opt, detail], index) => {
      const id = `${axisName}-${index}`;
      const label = document.createElement("label");
      label.className = "option-item";
      label.innerHTML = `
        <div class="option-name"><input type="checkbox" data-axis="${axisName}" value="${opt}" id="${id}" /><span>${opt}</span></div>
        <div class="option-desc">${detail}</div>`;
      optionsWrap.appendChild(label);
    });

    group.appendChild(optionsWrap);
    axisContainer.appendChild(group);
  });

  axisContainer.addEventListener("change", updateSelectedCount);
}

function getSelected() {
  const checked = axisContainer.querySelectorAll("input[type='checkbox']:checked");
  return Array.from(checked).map((item) => ({ axis: item.dataset.axis, option: item.value }));
}

function updateSelectedCount() {
  selectedCountEl.textContent = `已选 ${getSelected().length} 项`;
}

function clearSelections() {
  axisContainer.querySelectorAll("input[type='checkbox']").forEach((input) => (input.checked = false));
  updateSelectedCount();
}

async function generate(isRegenerate) {
  const apiUrl = apiUrlInput.value.trim();
  const model = modelInput.value.trim() || "MiniMax-M2.5";
  const extraPrompt = extraPromptInput.value.trim();
  const selections = getSelected();

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

let allDocSections = [];

async function loadDoc() {
  try {
    const md = await fetch("./OC.md").then((r) => r.text());
    allDocSections = parseDocSections(md);
    renderDoc(allDocSections);
  } catch {
    docContentEl.textContent = "OC.md 加载失败。";
  }
}

function parseDocSections(md) {
  const lines = md.split("\n");
  const sections = [];
  let current = { title: "文档开场", level: 1, text: "" };

  for (const line of lines) {
    const m = /^(#{1,3})\s+(.*)$/.exec(line);
    if (m) {
      if (current.text.trim()) sections.push({ ...current, text: current.text.trim() });
      current = { title: m[2].trim(), level: m[1].length, text: "" };
    } else {
      current.text += `${line}\n`;
    }
  }
  if (current.text.trim()) sections.push({ ...current, text: current.text.trim() });
  return sections;
}

function renderDoc(sections) {
  docTocEl.innerHTML = "";
  docContentEl.innerHTML = "";

  sections.forEach((sec, idx) => {
    const tocBtn = document.createElement("button");
    tocBtn.className = "toc-item";
    tocBtn.textContent = sec.title;
    tocBtn.onclick = () => {
      docContentEl.querySelectorAll(".doc-section")[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
      docTocEl.querySelectorAll(".toc-item").forEach((x) => x.classList.remove("active"));
      tocBtn.classList.add("active");
    };
    docTocEl.appendChild(tocBtn);

    const article = document.createElement("section");
    article.className = "doc-section";
    article.innerHTML = `<h3>${sec.title}</h3><div class="doc-text">${escapeHtml(sec.text)}</div>`;
    docContentEl.appendChild(article);
  });
}

function filterDoc(query) {
  if (!query) return renderDoc(allDocSections);
  const q = query.toLowerCase();
  const filtered = allDocSections.filter((s) => s.title.toLowerCase().includes(q) || s.text.toLowerCase().includes(q));
  renderDoc(filtered);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
