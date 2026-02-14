const AXES = {
  W: ["W1 铁律之笼", "W2 废墟之野", "W3 虚无之海", "W4 暗面之城", "W5 未知之境", "W6 修罗之场"],
  B: ["B1 凡人身体", "B2 非人身体", "B3 超越肉体"],
  P: ["P1 智力与制度", "P2 肉体与本能", "P3 精神与信念"],
  R: ["R1 秩序守卫者", "R2 秩序破坏者", "R3 被秩序抛弃"],
  M: ["M1 外部使命", "M2 创伤执念", "M3 自发觉醒", "M4 野心神化"],
  C: ["C1 坚守至击碎", "C2 计算后失灵", "C3 无条件选你"],
  E: ["E1 冰山闷骚", "E2 风流撩拨", "E3 直球懵懂", "E4 占有标记", "E5 照料爹系"],
  J: ["J1 完全不懂", "J2 努力学习", "J3 比人更懂人"],
  S: ["S1 极稳", "S2 有裂痕", "S3 已崩坏"],
  D: ["D1 他在上位", "D2 他在下位", "D3 势均力敌"],
  V: ["V1 你是锚点", "V2 你是药", "V3 你是劫数", "V4 你是猎物"],
  L: ["L1 爱真实你", "L2 爱你的功能", "L3 爱想象中的你"],
  A: ["A1 系于一物", "A2 系于一人", "A3 系于一念"],
  T: ["T1 寿命差", "T2 时间循环", "T3 时空错位", "T4 记忆侵蚀"],
  G: ["G1 个体级", "G2 规则级", "G3 因果级"],
  X: ["X1 降格", "X2 升格", "X3 湮灭"],
  F: ["F1 融合", "F2 入世", "F3 永隔", "F4 轮回"],
  Palette: [
    "东方古典",
    "新中式/国潮",
    "西方史诗",
    "废土写实",
    "赛博美学",
    "哥特/暗黑浪漫",
    "黑色电影/noir",
    "田园治愈",
    "暗黑童话/怪奇",
    "极简留白",
  ],
};

const axisContainer = document.getElementById("axisContainer");
const selectedCountEl = document.getElementById("selectedCount");
const clearBtn = document.getElementById("clearBtn");
const generateBtn = document.getElementById("generateBtn");
const regenBtn = document.getElementById("regenBtn");
const resultEl = document.getElementById("result");
const statusEl = document.getElementById("status");

const apiUrlInput = document.getElementById("apiUrl");
const modelInput = document.getElementById("model");
const extraPromptInput = document.getElementById("extraPrompt");

apiUrlInput.value = localStorage.getItem("oc_api_url") || "";
modelInput.value = localStorage.getItem("oc_model") || "MiniMax-M2.5";

renderAxes();
updateSelectedCount();

apiUrlInput.addEventListener("change", () => {
  localStorage.setItem("oc_api_url", apiUrlInput.value.trim());
});
modelInput.addEventListener("change", () => {
  localStorage.setItem("oc_model", modelInput.value.trim());
});
clearBtn.addEventListener("click", clearSelections);
generateBtn.addEventListener("click", () => generate(false));
regenBtn.addEventListener("click", () => generate(true));

function renderAxes() {
  Object.entries(AXES).forEach(([axisName, options]) => {
    const group = document.createElement("section");
    group.className = "axis-group";

    const title = document.createElement("h3");
    title.textContent = axisName === "Palette" ? "调色板（可选）" : `${axisName} 轴`;
    group.appendChild(title);

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "options";

    options.forEach((opt, index) => {
      const id = `${axisName}-${index}`;
      const label = document.createElement("label");
      label.className = "option-item";
      label.innerHTML = `<input type="checkbox" data-axis="${axisName}" value="${opt}" id="${id}" /><span>${opt}</span>`;
      optionsWrap.appendChild(label);
    });

    group.appendChild(optionsWrap);
    axisContainer.appendChild(group);
  });

  axisContainer.addEventListener("change", updateSelectedCount);
}

function getSelected() {
  const checked = axisContainer.querySelectorAll("input[type='checkbox']:checked");
  return Array.from(checked).map((item) => ({
    axis: item.dataset.axis,
    option: item.value,
  }));
}

function updateSelectedCount() {
  const count = getSelected().length;
  selectedCountEl.textContent = `已选 ${count} 项`;
}

function clearSelections() {
  axisContainer.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = false;
  });
  updateSelectedCount();
}

async function generate(isRegenerate) {
  const apiUrl = apiUrlInput.value.trim();
  const model = modelInput.value.trim() || "MiniMax-M2.5";
  const extraPrompt = extraPromptInput.value.trim();
  const selections = getSelected();

  if (!apiUrl) {
    setStatus("请先填写 Worker API 地址。", true);
    return;
  }

  if (selections.length < 3) {
    setStatus("至少选择 3 项轴要素。", true);
    return;
  }

  setLoading(true);
  setStatus(isRegenerate ? "正在重新生成…" : "正在生成…", false);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selections, model, extraPrompt }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "生成失败");
    }

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
  statusEl.style.color = isError ? "#ff7b7b" : "#a9afc3";
}
