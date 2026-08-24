import { getAxis, type AxisId, type Locale } from "../domain";
import type { AppState, GeneratedResult, ResultSection } from "./state";

function stripCode(label: string): string {
  return label.replace(/^[A-Z]+\d*\s+/, "").trim();
}

function selectedEntry(state: AppState, axisId: AxisId) {
  const axis = getAxis(axisId);
  const optionId = state.selections[axisId];
  const option = optionId
    ? axis.options.find((candidate) => candidate.id === optionId)
    : undefined;
  return option
    ? {
        axis: axis.copy[state.locale].description,
        label: stripCode(option.copy[state.locale].label),
        summary: option.copy[state.locale].summary,
      }
    : null;
}

function linesFor(
  state: AppState,
  axisIds: readonly AxisId[],
  locale: Locale,
): string[] {
  return axisIds.flatMap((axisId) => {
    const entry = selectedEntry(state, axisId);
    if (!entry) return [];
    return locale === "zh"
      ? [`**${entry.axis}｜${entry.label}。** ${entry.summary}。`]
      : [`**${entry.axis} — ${entry.label}.** ${entry.summary}.`];
  });
}

function makeSection(
  id: string,
  title: string,
  body: readonly string[],
): ResultSection {
  return { id, title, body };
}

function openingParagraph(state: AppState): string {
  const locale = state.locale;
  const world = selectedEntry(state, "world")?.label;
  const motive = selectedEntry(state, "motive")?.label;
  const heroine = selectedEntry(state, "heroine")?.label;
  const expression = selectedEntry(state, "expression")?.label;
  const palette = selectedEntry(state, "palette")?.label;

  if (locale === "zh") {
    return [
      world ? `开场落在“${world}”留下的具体压力里` : "开场先给出一项无法绕开的现实压力",
      motive ? `，他仍被“${motive}”驱动` : "，他尚未说出真正的动机",
      heroine ? `；女主以“${heroine}”的位置进入事件` : "；女主不是旁观者，她的行动改变局面",
      expression ? `。他的感情通过“${expression}”泄露出来` : "。感情不被解释，只通过行动露出",
      palette ? `，文字保持“${palette}”的质感。` : "。",
    ].join("");
  }

  return [
    world
      ? `The opening begins inside the concrete pressure of “${world}”`
      : "The opening begins with a pressure neither character can evade",
    motive
      ? `, while he is still driven by “${motive}”`
      : ", before he can admit what truly drives him",
    heroine
      ? `. The heroine enters from the position of “${heroine}” and changes the event`
      : ". The heroine is no spectator; her action changes the event",
    expression
      ? `. His feeling leaks through “${expression}”`
      : ". Feeling is shown through action, not explanation",
    palette ? `, rendered with a “${palette}” texture.` : ".",
  ].join("");
}

function fateParagraph(state: AppState): string {
  const locale = state.locale;
  const choice = selectedEntry(state, "choice")?.label;
  const time = selectedEntry(state, "time")?.label;
  const exchange = selectedEntry(state, "exchange")?.label;
  const finale = selectedEntry(state, "finale")?.label;

  if (locale === "zh") {
    return [
      choice ? `当故事逼他作出“${choice}”时` : "当故事终于逼他作出选择时",
      exchange ? `，这个选择具体索取“${exchange}”` : "，代价仍是一处等待作者落笔的缺口",
      time ? `；“${time}”决定代价抵达的节奏` : "；时间压力尚未设定",
      finale ? `，最终收束为“${finale}”。` : "，终局因此保持开放。",
    ].join("");
  }

  return [
    choice
      ? `When the story forces “${choice}”`
      : "When the story finally forces a choice",
    exchange
      ? `, that decision exacts “${exchange}”`
      : ", its cost remains an intentional gap for the author",
    time
      ? `. “${time}” controls the rhythm of its arrival`
      : ". The time pressure remains open",
    finale ? `, resolving as “${finale}.”` : ", so the ending stays open.",
  ].join("");
}

function toMarkdown(title: string, sections: readonly ResultSection[]): string {
  return [
    `# ${title}`,
    "",
    ...sections.flatMap((section) => [
      `## ${section.title}`,
      "",
      ...section.body.flatMap((paragraph) => [paragraph, ""]),
    ]),
  ]
    .join("\n")
    .trim();
}

export function generateLocalPreview(state: AppState): GeneratedResult {
  const locale = state.locale;
  const motive = selectedEntry(state, "motive")?.label;
  const finale = selectedEntry(state, "finale")?.label;
  const title =
    locale === "zh"
      ? [motive ?? "尚未命名的动机", finale ?? "开放终局"].join(" · ")
      : [motive ?? "Unnamed motive", finale ?? "Open ending"].join(" · ");

  const sections: ResultSection[] = [
    makeSection(
      "world",
      locale === "zh" ? "世界与存在" : "World & Existence",
      linesFor(state, ["world", "body", "power", "role"], locale),
    ),
    makeSection(
      "core",
      locale === "zh" ? "角色内核" : "Character Core",
      linesFor(state, ["motive", "sanity", "achilles"], locale),
    ),
    makeSection(
      "bond",
      locale === "zh" ? "关系机制" : "Relationship Mechanics",
      linesFor(
        state,
        ["heroine", "dynamic", "love", "expression", "judgment"],
        locale,
      ),
    ),
    makeSection(
      "opening",
      locale === "zh" ? "开场切片" : "Opening Slice",
      [openingParagraph(state)],
    ),
  ];

  if (state.outputMode === "timeline") {
    sections.push(
      makeSection(
        "fate",
        locale === "zh" ? "命运弧线" : "Fate Arc",
        [
          ...linesFor(state, ["choice", "time", "exchange", "finale"], locale),
          fateParagraph(state),
        ],
      ),
    );
  }

  if (state.extraPrompt.trim()) {
    sections.push(
      makeSection(
        "direction",
        locale === "zh" ? "本次补充要求" : "Additional Direction",
        [state.extraPrompt.trim()],
      ),
    );
  }

  const nonEmptySections = sections.filter((section) => section.body.length > 0);
  return {
    title,
    sections: nonEmptySections,
    markdown: toMarkdown(title, nonEmptySections),
    createdAt: new Date().toISOString(),
  };
}
