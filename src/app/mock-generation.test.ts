import { describe, expect, it } from "vitest";

import { generateLocalPreview } from "./mock-generation";
import type { AppState } from "./state";

function state(overrides: Partial<AppState> = {}): AppState {
  return {
    locale: "zh",
    activeChapter: "context",
    outputMode: "opening",
    connectionMode: "default",
    selections: {
      world: "W1",
      motive: "M1",
      heroine: "H1",
    },
    extraPrompt: "",
    providerId: "",
    modelId: "",
    view: "editor",
    undoSelections: null,
    result: null,
    notice: "",
    ...overrides,
  };
}

describe("local preview generation", () => {
  it("builds an opening preview without any provider configuration", () => {
    const result = generateLocalPreview(state());
    expect(result.sections.map((section) => section.id)).toEqual([
      "world",
      "core",
      "bond",
      "opening",
    ]);
    expect(result.markdown).toContain("## 开场切片");
  });

  it("adds the fate arc only for explicit timeline mode", () => {
    const result = generateLocalPreview(
      state({
        outputMode: "timeline",
        selections: {
          world: "W1",
          motive: "M1",
          heroine: "H1",
          choice: "C1",
          exchange: "X1",
          finale: "F2",
        },
      }),
    );
    expect(result.sections.some((section) => section.id === "fate")).toBe(true);
    expect(result.markdown).toContain("## 命运弧线");
  });
});
