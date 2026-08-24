import {
  AXES,
  DOMAIN_SCHEMA_VERSION,
  getAxis,
  optionBelongsToAxis,
  type AxisId,
  type Locale,
  type OptionId,
} from "../domain";
import { CHAPTER_BY_ID, type ChapterId } from "./chapters";

export type ConnectionMode = "default" | "custom";
export type ViewMode = "editor" | "result";
export type OutputMode = "opening" | "timeline";
export type SelectionState = Partial<Record<AxisId, OptionId>>;

export interface AppState {
  locale: Locale;
  activeChapter: ChapterId;
  outputMode: OutputMode;
  connectionMode: ConnectionMode;
  selections: SelectionState;
  extraPrompt: string;
  providerId: string;
  modelId: string;
  view: ViewMode;
  undoSelections: SelectionState | null;
  result: GeneratedResult | null;
  notice: string;
}

export interface ResultSection {
  readonly id: string;
  readonly title: string;
  readonly body: readonly string[];
}

export interface GeneratedResult {
  readonly title: string;
  readonly markdown: string;
  readonly sections: readonly ResultSection[];
  readonly createdAt: string;
}

interface PersistedDraft {
  readonly schemaVersion: typeof DOMAIN_SCHEMA_VERSION;
  readonly locale: Locale;
  readonly activeChapter: ChapterId;
  readonly outputMode: OutputMode;
  readonly connectionMode: ConnectionMode;
  readonly selections: SelectionState;
  readonly extraPrompt: string;
  readonly providerId: string;
  readonly modelId: string;
}

const DRAFT_STORAGE_KEY = "oc-fate-loom:draft:v3";

const DEFAULT_STATE: AppState = {
  locale: "zh",
  activeChapter: "context",
  outputMode: "opening",
  connectionMode: "default",
  selections: {},
  extraPrompt: "",
  providerId: "",
  modelId: "",
  view: "editor",
  undoSelections: null,
  result: null,
  notice: "",
};

function isLocale(value: unknown): value is Locale {
  return value === "zh" || value === "en";
}

function isChapter(value: unknown): value is ChapterId {
  return typeof value === "string" && CHAPTER_BY_ID.has(value as ChapterId);
}

function sanitizeSelections(value: unknown): SelectionState {
  if (!value || typeof value !== "object") return {};

  const result: SelectionState = {};
  for (const axis of AXES) {
    const optionId = (value as Record<string, unknown>)[axis.id];
    if (
      typeof optionId === "string" &&
      optionBelongsToAxis(axis.id, optionId as OptionId)
    ) {
      result[axis.id] = optionId as OptionId;
    }
  }
  return result;
}

export function createInitialState(): AppState {
  if (typeof window === "undefined") return structuredClone(DEFAULT_STATE);

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const draft = JSON.parse(raw) as Partial<PersistedDraft>;
    if (draft.schemaVersion !== DOMAIN_SCHEMA_VERSION) {
      return structuredClone(DEFAULT_STATE);
    }

    return {
      ...structuredClone(DEFAULT_STATE),
      locale: isLocale(draft.locale) ? draft.locale : "zh",
      activeChapter: isChapter(draft.activeChapter)
        ? draft.activeChapter
        : "context",
      outputMode:
        draft.outputMode === "timeline" ? "timeline" : "opening",
      connectionMode:
        draft.connectionMode === "custom" ? "custom" : "default",
      selections: sanitizeSelections(draft.selections),
      extraPrompt:
        typeof draft.extraPrompt === "string"
          ? draft.extraPrompt.slice(0, 1200)
          : "",
      providerId:
        typeof draft.providerId === "string" ? draft.providerId.slice(0, 80) : "",
      modelId:
        typeof draft.modelId === "string" ? draft.modelId.slice(0, 160) : "",
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function persistSafeDraft(state: AppState): void {
  if (typeof window === "undefined") return;

  const draft: PersistedDraft = {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    locale: state.locale,
    activeChapter: state.activeChapter,
    outputMode: state.outputMode,
    connectionMode: state.connectionMode,
    selections: { ...state.selections },
    extraPrompt: state.extraPrompt.slice(0, 1200),
    providerId: state.providerId.slice(0, 80),
    modelId: state.modelId.slice(0, 160),
  };

  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Draft persistence is optional; the application remains fully usable.
  }
}

export function selectedCount(state: AppState): number {
  return Object.keys(state.selections).length;
}

export function selectedStructureCount(state: AppState): number {
  return AXES.filter(
    (axis) => axis.kind === "structure" && state.selections[axis.id],
  ).length;
}

export function hasNarrativeAnchors(state: AppState): boolean {
  const groups: readonly (readonly AxisId[])[] = [
    ["world", "body", "power", "role"],
    ["motive", "sanity", "achilles"],
    ["heroine", "dynamic", "love", "expression", "judgment"],
  ];
  return groups.every((group) => group.some((axisId) => state.selections[axisId]));
}

export function getSelectedOptionLabel(
  state: AppState,
  axisId: AxisId,
): string | null {
  const optionId = state.selections[axisId];
  if (!optionId) return null;
  const option = getAxis(axisId).options.find((entry) => entry.id === optionId);
  return option?.copy[state.locale].label ?? null;
}
