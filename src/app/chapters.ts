import type { AxisId, Locale } from "../domain";

export type ChapterId = "context" | "core" | "bond" | "fate" | "palette";

export interface ChapterDefinition {
  readonly id: ChapterId;
  readonly index: string;
  readonly axisIds: readonly AxisId[];
  readonly title: Readonly<Record<Locale, string>>;
  readonly summary: Readonly<Record<Locale, string>>;
}

export const CHAPTERS: readonly ChapterDefinition[] = Object.freeze([
  {
    id: "context",
    index: "I",
    axisIds: ["world", "body", "power", "role"],
    title: { zh: "境遇与边界", en: "Circumstance & Limits" },
    summary: {
      zh: "先决定世界如何施压，以及他以什么形态和力量活在其中。",
      en: "Set the pressure of the world and the form in which he survives it.",
    },
  },
  {
    id: "core",
    index: "II",
    axisIds: ["motive", "sanity", "achilles"],
    title: { zh: "内核与裂缝", en: "Core & Fracture" },
    summary: {
      zh: "他为何活着，哪里会崩坏，以及什么能真正刺穿他。",
      en: "Why he lives, where he breaks, and what can truly reach him.",
    },
  },
  {
    id: "bond",
    index: "III",
    axisIds: ["heroine", "dynamic", "love", "expression", "judgment"],
    title: { zh: "关系如何发生", en: "How the Bond Forms" },
    summary: {
      zh: "让两个人拥有各自的位置、误读、拉锯和逐渐改变的看法。",
      en: "Give both people agency, misreadings, power shifts, and changing perception.",
    },
  },
  {
    id: "fate",
    index: "IV",
    axisIds: ["choice", "time", "exchange", "finale"],
    title: { zh: "命运如何收紧", en: "How Fate Tightens" },
    summary: {
      zh: "抉择开始索要代价，时间则决定一切如何抵达终局。",
      en: "Choice begins to demand a cost; time decides how the ending arrives.",
    },
  },
  {
    id: "palette",
    index: "V",
    axisIds: ["palette"],
    title: { zh: "文字质感", en: "Textual Palette" },
    summary: {
      zh: "只改变叙述的触感，不替人物改写命运。",
      en: "Change the texture of the telling, never the fate underneath it.",
    },
  },
]);

export const CHAPTER_BY_ID = new Map(
  CHAPTERS.map((chapter) => [chapter.id, chapter] as const),
);

export function chapterForAxis(axisId: AxisId): ChapterDefinition {
  const chapter = CHAPTERS.find((entry) => entry.axisIds.includes(axisId));
  if (!chapter) {
    throw new RangeError(`No chapter contains axis: ${axisId}`);
  }
  return chapter;
}
