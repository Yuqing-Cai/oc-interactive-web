import {
  getAxis,
  getOption,
  optionBelongsToAxis,
  type AxisCode,
  type AxisId,
  type FateSelection,
  type OptionId,
} from "./axes";
import type { Locale, LocalizedText } from "./schema";

export const CAUSALITY_BRANCH_LIMIT = 3 as const;

export type CausalityTrack = "trunk" | "branch";
export type CausalityRelationKind =
  | "directed"
  | "convergent"
  | "constraint"
  | "co-created"
  | "reciprocal";
export type CausalityStatus = "empty" | "forming" | "closed";
export type CausalityGapMode = "all" | "any";

export type CausalityRelationId =
  | "world-choice"
  | "motive-choice"
  | "choice-exchange"
  | "body-time"
  | "time-finale"
  | "power-exchange"
  | "exchange-finale"
  | "motive-exchange"
  | "role-heroine-dynamic"
  | "sanity-communication"
  | "expression-judgment"
  | "heroine-love"
  | "love-achilles";

export type CausalityGapId =
  | "origin"
  | "choice"
  | "time"
  | "exchange-source"
  | "exchange"
  | "finale-source"
  | "finale";

export interface CausalityNode {
  readonly axisId: AxisId;
  readonly axisCode: AxisCode;
  readonly optionId: OptionId;
  readonly label: string;
}

export interface CausalityRelation {
  readonly id: CausalityRelationId;
  readonly track: CausalityTrack;
  readonly kind: CausalityRelationKind;
  readonly sources: readonly CausalityNode[];
  readonly targets: readonly CausalityNode[];
  /** A localized semantic result for rules such as E + J → communication. */
  readonly outcome: string | null;
  readonly text: string;
}

export interface CausalityGap {
  readonly id: CausalityGapId;
  readonly anchors: readonly CausalityNode[];
  readonly missingAxisIds: readonly AxisId[];
  /** Whether every missing axis is needed, or any one of them can fill the gap. */
  readonly mode: CausalityGapMode;
  readonly text: string;
}

export interface CausalityResult {
  readonly locale: Locale;
  readonly status: CausalityStatus;
  /** Palette selections are intentionally excluded from the causal system. */
  readonly selected: readonly CausalityNode[];
  readonly trunk: readonly CausalityRelation[];
  /** At most three rule-ranked relationship branches. */
  readonly branches: readonly CausalityRelation[];
  readonly gaps: readonly CausalityGap[];
  readonly summary: string;
}

type RelationCopy = (
  sources: readonly CausalityNode[],
  targets: readonly CausalityNode[],
) => string;

interface RelationDefinition {
  readonly id: CausalityRelationId;
  readonly track: CausalityTrack;
  readonly kind: CausalityRelationKind;
  readonly sourceAxisIds: readonly AxisId[];
  readonly targetAxisIds: readonly AxisId[];
  readonly outcome: LocalizedText | null;
  readonly copy: Readonly<Record<Locale, RelationCopy>>;
}

const quote = (node: CausalityNode): string => `“${node.label}”`;

const TRUNK_DEFINITIONS: readonly RelationDefinition[] = [
  {
    id: "world-choice",
    track: "trunk",
    kind: "directed",
    sourceAxisIds: ["world"],
    targetAxisIds: ["choice"],
    outcome: null,
    copy: {
      zh: (sources, targets) =>
        `${quote(sources[0]!)}向${quote(targets[0]!)}施加世界压力。`,
      en: (sources, targets) =>
        `${quote(sources[0]!)} puts the world's pressure behind ${quote(targets[0]!)}.`,
    },
  },
  {
    id: "motive-choice",
    track: "trunk",
    kind: "directed",
    sourceAxisIds: ["motive"],
    targetAxisIds: ["choice"],
    outcome: null,
    copy: {
      zh: (sources, targets) =>
        `${quote(sources[0]!)}驱动${quote(targets[0]!)}的抉择方向。`,
      en: (sources, targets) =>
        `${quote(sources[0]!)} drives the direction of ${quote(targets[0]!)}.`,
    },
  },
  {
    id: "body-time",
    track: "trunk",
    kind: "directed",
    sourceAxisIds: ["body"],
    targetAxisIds: ["time"],
    outcome: null,
    copy: {
      zh: (sources, targets) =>
        `${quote(sources[0]!)}为${quote(targets[0]!)}制造身体与时间的限制。`,
      en: (sources, targets) =>
        `${quote(sources[0]!)} gives ${quote(targets[0]!)} its bodily and temporal constraint.`,
    },
  },
  {
    id: "choice-exchange",
    track: "trunk",
    kind: "directed",
    sourceAxisIds: ["choice"],
    targetAxisIds: ["exchange"],
    outcome: null,
    copy: {
      zh: (sources, targets) =>
        `${quote(sources[0]!)}使${quote(targets[0]!)}成为这次抉择付出的代价。`,
      en: (sources, targets) =>
        `${quote(sources[0]!)} makes ${quote(targets[0]!)} the cost of that choice.`,
    },
  },
  {
    id: "power-exchange",
    track: "trunk",
    kind: "directed",
    sourceAxisIds: ["power"],
    targetAxisIds: ["exchange"],
    outcome: null,
    copy: {
      zh: (sources, targets) =>
        `${quote(sources[0]!)}决定${quote(targets[0]!)}的代价量级。`,
      en: (sources, targets) =>
        `${quote(sources[0]!)} sets the scale of ${quote(targets[0]!)}.`,
    },
  },
  {
    id: "time-finale",
    track: "trunk",
    kind: "directed",
    sourceAxisIds: ["time"],
    targetAxisIds: ["finale"],
    outcome: null,
    copy: {
      zh: (sources, targets) =>
        `${quote(sources[0]!)}规定了走向${quote(targets[0]!)}的节奏。`,
      en: (sources, targets) =>
        `${quote(sources[0]!)} sets the pace toward ${quote(targets[0]!)}.`,
    },
  },
  {
    id: "exchange-finale",
    track: "trunk",
    kind: "directed",
    sourceAxisIds: ["exchange"],
    targetAxisIds: ["finale"],
    outcome: null,
    copy: {
      zh: (sources, targets) =>
        `${quote(sources[0]!)}收束为${quote(targets[0]!)}的终局。`,
      en: (sources, targets) =>
        `${quote(sources[0]!)} resolves into ${quote(targets[0]!)}.`,
    },
  },
];

/**
 * Branch order is intentional: motive/cost coherence first, then multi-axis
 * relationship structures, then the remaining pairwise modifiers.
 */
const BRANCH_DEFINITIONS: readonly RelationDefinition[] = [
  {
    id: "motive-exchange",
    track: "branch",
    kind: "reciprocal",
    sourceAxisIds: ["motive"],
    targetAxisIds: ["exchange"],
    outcome: null,
    copy: {
      zh: (sources, targets) =>
        `${quote(targets[0]!)}的代价回应${quote(sources[0]!)}的核心动机。`,
      en: (sources, targets) =>
        `The cost in ${quote(targets[0]!)} echoes the core motive in ${quote(sources[0]!)}.`,
    },
  },
  {
    id: "role-heroine-dynamic",
    track: "branch",
    kind: "convergent",
    sourceAxisIds: ["role", "heroine"],
    targetAxisIds: ["dynamic"],
    outcome: null,
    copy: {
      zh: (sources, targets) =>
        `${quote(sources[0]!)}与${quote(sources[1]!)}共同塑造${quote(targets[0]!)}的权力起点。`,
      en: (sources, targets) =>
        `${quote(sources[0]!)} and ${quote(sources[1]!)} jointly shape the starting power balance in ${quote(targets[0]!)}.`,
    },
  },
  {
    id: "expression-judgment",
    track: "branch",
    kind: "co-created",
    sourceAxisIds: ["expression", "judgment"],
    targetAxisIds: [],
    outcome: { zh: "沟通模式", en: "communication pattern" },
    copy: {
      zh: (sources) =>
        `${quote(sources[0]!)}与${quote(sources[1]!)}共同形成这段关系的沟通模式。`,
      en: (sources) =>
        `${quote(sources[0]!)} and ${quote(sources[1]!)} jointly form the relationship's communication pattern.`,
    },
  },
  {
    id: "love-achilles",
    track: "branch",
    kind: "co-created",
    sourceAxisIds: ["love", "achilles"],
    targetAxisIds: [],
    outcome: { zh: "关系深度", en: "relationship depth" },
    copy: {
      zh: (sources) =>
        `${quote(sources[0]!)}与${quote(sources[1]!)}共同形成这段关系的深度与软肋。`,
      en: (sources) =>
        `${quote(sources[0]!)} and ${quote(sources[1]!)} jointly form the relationship's depth and vulnerability.`,
    },
  },
  {
    id: "heroine-love",
    track: "branch",
    kind: "directed",
    sourceAxisIds: ["heroine"],
    targetAxisIds: ["love"],
    outcome: null,
    copy: {
      zh: (sources, targets) =>
        `${quote(sources[0]!)}推动${quote(targets[0]!)}的关系认知演变。`,
      en: (sources, targets) =>
        `${quote(sources[0]!)} advances the perception arc in ${quote(targets[0]!)}.`,
    },
  },
];

function toSelectionMap(
  selections: readonly FateSelection[],
): ReadonlyMap<AxisId, FateSelection> {
  const result = new Map<AxisId, FateSelection>();

  for (const selection of selections) {
    if (!optionBelongsToAxis(selection.axisId, selection.optionId)) {
      throw new RangeError(
        `Option ${selection.optionId} does not belong to axis ${selection.axisId}`,
      );
    }

    // App state is one value per axis. If migrated input contains duplicates,
    // the last value mirrors the reducer's replacement semantics.
    result.set(selection.axisId, selection);
  }

  return result;
}

function makeNode(
  selection: FateSelection,
  locale: Locale,
): CausalityNode {
  const axis = getAxis(selection.axisId);
  return {
    axisId: selection.axisId,
    axisCode: axis.code,
    optionId: selection.optionId,
    label: getOption(selection.optionId).copy[locale].label,
  };
}

function selectedNodes(
  selectionMap: ReadonlyMap<AxisId, FateSelection>,
  axisIds: readonly AxisId[],
  locale: Locale,
): CausalityNode[] | null {
  const nodes: CausalityNode[] = [];

  for (const axisId of axisIds) {
    const selection = selectionMap.get(axisId);
    if (!selection) {
      return null;
    }
    nodes.push(makeNode(selection, locale));
  }

  return nodes;
}

function buildRelation(
  definition: RelationDefinition,
  selectionMap: ReadonlyMap<AxisId, FateSelection>,
  locale: Locale,
): CausalityRelation | null {
  const sources = selectedNodes(
    selectionMap,
    definition.sourceAxisIds,
    locale,
  );
  const targets = selectedNodes(
    selectionMap,
    definition.targetAxisIds,
    locale,
  );

  if (!sources || !targets) {
    return null;
  }

  return {
    id: definition.id,
    track: definition.track,
    kind: definition.kind,
    sources,
    targets,
    outcome: definition.outcome?.[locale] ?? null,
    text: definition.copy[locale](sources, targets),
  };
}

function buildSanityBranch(
  selectionMap: ReadonlyMap<AxisId, FateSelection>,
  locale: Locale,
): CausalityRelation | null {
  const sources = selectedNodes(selectionMap, ["sanity"], locale);
  if (!sources) {
    return null;
  }

  const targetAxisIds = (["expression", "judgment"] as const).filter(
    (axisId) => selectionMap.has(axisId),
  );
  const targets = selectedNodes(selectionMap, targetAxisIds, locale);
  if (!targets || targets.length === 0) {
    return null;
  }

  const targetText =
    locale === "zh"
      ? targets.map(quote).join("与")
      : targets.map(quote).join(" and ");

  return {
    id: "sanity-communication",
    track: "branch",
    kind: "constraint",
    sources,
    targets,
    outcome: null,
    text:
      locale === "zh"
        ? `${quote(sources[0]!)}限制${targetText}的稳定性。`
        : `${quote(sources[0]!)} limits the stability of ${targetText}.`,
  };
}

function joinQuoted(nodes: readonly CausalityNode[], locale: Locale): string {
  const labels = nodes.map(quote);
  if (labels.length <= 1) {
    return labels[0] ?? "";
  }
  const separator = locale === "zh" ? "与" : " and ";
  return labels.join(separator);
}

function makeGap(
  id: CausalityGapId,
  anchors: readonly CausalityNode[],
  missingAxisIds: readonly AxisId[],
  mode: CausalityGapMode,
  text: string,
): CausalityGap {
  return { id, anchors, missingAxisIds, mode, text };
}

function buildGaps(
  selectionMap: ReadonlyMap<AxisId, FateSelection>,
  locale: Locale,
): CausalityGap[] {
  const gaps: CausalityGap[] = [];
  const has = (axisId: AxisId): boolean => selectionMap.has(axisId);
  const nodes = (...axisIds: AxisId[]): CausalityNode[] =>
    selectedNodes(
      selectionMap,
      axisIds.filter(has),
      locale,
    ) ?? [];

  if (has("choice") && !has("world") && !has("motive")) {
    const anchors = nodes("choice");
    gaps.push(
      makeGap(
        "origin",
        anchors,
        ["world", "motive"],
        "any",
        locale === "zh"
          ? `${joinQuoted(anchors, locale)}已有抉择，但还缺少 W 世界或 M 动机作为起因。`
          : `${joinQuoted(anchors, locale)} defines a choice, but still needs either W World or M Motive as its cause.`,
      ),
    );
  } else if ((has("world") || has("motive")) && !has("choice")) {
    const anchors = nodes("world", "motive");
    gaps.push(
      makeGap(
        "choice",
        anchors,
        ["choice"],
        "all",
        locale === "zh"
          ? `${joinQuoted(anchors, locale)}已有命运起点，但还缺少 C 抉择来承接压力。`
          : `${joinQuoted(anchors, locale)} provides a starting cause, but still needs C Choice to carry that pressure forward.`,
      ),
    );
  }

  if (has("body") && !has("time")) {
    const anchors = nodes("body");
    gaps.push(
      makeGap(
        "time",
        anchors,
        ["time"],
        "all",
        locale === "zh"
          ? `${joinQuoted(anchors, locale)}已经定义身体边界；补入 T 时间可以让限制进入命运线。`
          : `${joinQuoted(anchors, locale)} defines the bodily boundary; T Time can carry that constraint into the fate line.`,
      ),
    );
  }

  if (has("exchange") && !has("choice") && !has("power")) {
    const anchors = nodes("exchange");
    gaps.push(
      makeGap(
        "exchange-source",
        anchors,
        ["choice", "power"],
        "any",
        locale === "zh"
          ? `${joinQuoted(anchors, locale)}已有代价，但还缺少 C 抉择或 P 力量说明它为何发生。`
          : `${joinQuoted(anchors, locale)} defines a cost, but still needs C Choice or P Power to explain what produces it.`,
      ),
    );
  } else if ((has("choice") || has("power")) && !has("exchange")) {
    const anchors = nodes("choice", "power");
    gaps.push(
      makeGap(
        "exchange",
        anchors,
        ["exchange"],
        "all",
        locale === "zh"
          ? `${joinQuoted(anchors, locale)}已经把故事推向后果，但还缺少 X 代价。`
          : `${joinQuoted(anchors, locale)} pushes the story toward consequence, but X Cost is still missing.`,
      ),
    );
  }

  if (has("finale") && !has("exchange") && !has("time")) {
    const anchors = nodes("finale");
    gaps.push(
      makeGap(
        "finale-source",
        anchors,
        ["exchange", "time"],
        "any",
        locale === "zh"
          ? `${joinQuoted(anchors, locale)}已有终局，但还缺少 X 代价或 T 时间作为通向它的路径。`
          : `${joinQuoted(anchors, locale)} defines a finale, but still needs X Cost or T Time as a path toward it.`,
      ),
    );
  } else if ((has("exchange") || has("time")) && !has("finale")) {
    const anchors = nodes("exchange", "time");
    gaps.push(
      makeGap(
        "finale",
        anchors,
        ["finale"],
        "all",
        locale === "zh"
          ? `${joinQuoted(anchors, locale)}已经形成后果，但还缺少 F 终局来收束命运线。`
          : `${joinQuoted(anchors, locale)} defines the consequence, but F Finale is still needed to close the fate line.`,
      ),
    );
  }

  return gaps;
}

function hasClosedPath(selectionMap: ReadonlyMap<AxisId, FateSelection>): boolean {
  const has = (axisId: AxisId): boolean => selectionMap.has(axisId);
  const choicePath =
    (has("world") || has("motive")) &&
    has("choice") &&
    has("exchange") &&
    has("finale");
  const timePath = has("body") && has("time") && has("finale");
  const powerPath = has("power") && has("exchange") && has("finale");
  return choicePath || timePath || powerPath;
}

function summarize(
  locale: Locale,
  status: CausalityStatus,
  selectedCount: number,
  trunkCount: number,
  branchCount: number,
): string {
  if (status === "empty") {
    return locale === "zh"
      ? "尚未形成联动。先选一条结构轴，这里会显示它如何牵动后续。"
      : "No linkage yet. Select a structural axis to see how it shapes what follows.";
  }

  if (trunkCount + branchCount === 0) {
    return locale === "zh"
      ? `已有 ${selectedCount} 条设定，但它们尚未形成直接联动。`
      : `${selectedCount} ${selectedCount === 1 ? "selection is" : "selections are"} present, but no direct linkage has formed yet.`;
  }

  if (locale === "zh") {
    const lead = status === "closed" ? "命运主干已闭合" : "命运线正在形成";
    return `${lead}：${trunkCount} 条主干联动，${branchCount} 条关系支线。`;
  }

  const lead =
    status === "closed" ? "The fate spine is closed" : "The fate line is forming";
  const trunkWord = trunkCount === 1 ? "link" : "links";
  const branchWord = branchCount === 1 ? "branch" : "branches";
  return `${lead}: ${trunkCount} trunk ${trunkWord}, ${branchCount} relationship ${branchWord}.`;
}

/**
 * Derives the visible fate spine, ranked relationship branches, and actionable
 * gaps from stable axis selections. This is a pure, model-free rule engine.
 */
export function deriveCausality(
  selections: readonly FateSelection[],
  locale: Locale,
): CausalityResult {
  const selectionMap = toSelectionMap(selections);
  const selected = [...selectionMap.values()]
    .filter((selection) => getAxis(selection.axisId).kind === "structure")
    .sort(
      (left, right) =>
        getAxis(left.axisId).order - getAxis(right.axisId).order,
    )
    .map((selection) => makeNode(selection, locale));

  const trunk = TRUNK_DEFINITIONS.map((definition) =>
    buildRelation(definition, selectionMap, locale),
  ).filter((relation): relation is CausalityRelation => relation !== null);

  const branches = [
    ...BRANCH_DEFINITIONS.map((definition) =>
      buildRelation(definition, selectionMap, locale),
    ),
    buildSanityBranch(selectionMap, locale),
  ]
    .filter((relation): relation is CausalityRelation => relation !== null)
    .slice(0, CAUSALITY_BRANCH_LIMIT);

  const status: CausalityStatus =
    selected.length === 0
      ? "empty"
      : hasClosedPath(selectionMap)
        ? "closed"
        : "forming";
  const gaps = buildGaps(selectionMap, locale);

  return {
    locale,
    status,
    selected,
    trunk,
    branches,
    gaps,
    summary: summarize(
      locale,
      status,
      selected.length,
      trunk.length,
      branches.length,
    ),
  };
}
