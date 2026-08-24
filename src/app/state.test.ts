import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DOMAIN_SCHEMA_VERSION } from "../domain";
import {
  createInitialState,
  persistSafeDraft,
  type AppState,
} from "./state";

const DRAFT_KEY = "oc-fate-loom:draft:v3";

describe("safe draft persistence", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("persists only the allow-listed draft fields", () => {
    const state: AppState = {
      locale: "zh",
      activeChapter: "core",
      outputMode: "opening",
      connectionMode: "custom",
      selections: { world: "W1", motive: "M1" },
      extraPrompt: "克制推进",
      providerId: "future-provider",
      modelId: "future-model",
      view: "result",
      undoSelections: { world: "W2" },
      result: {
        title: "must not persist",
        markdown: "must not persist",
        sections: [],
        createdAt: new Date(0).toISOString(),
      },
      notice: "must not persist",
    };

    persistSafeDraft(state);
    const raw = storage.get(DRAFT_KEY)!;
    const saved = JSON.parse(raw) as Record<string, unknown>;

    expect(Object.keys(saved).sort()).toEqual([
      "activeChapter",
      "connectionMode",
      "extraPrompt",
      "locale",
      "modelId",
      "outputMode",
      "providerId",
      "schemaVersion",
      "selections",
    ]);
    expect(raw).not.toContain("must not persist");
    expect(raw).not.toContain("apiKey");
  });

  it("drops unknown axes and options that belong to a different axis", () => {
    storage.set(
      DRAFT_KEY,
      JSON.stringify({
        schemaVersion: DOMAIN_SCHEMA_VERSION,
        locale: "en",
        activeChapter: "bond",
        outputMode: "timeline",
        connectionMode: "custom",
        selections: {
          world: "M1",
          motive: "M1",
          imaginaryAxis: "W1",
        },
      }),
    );

    const state = createInitialState();
    expect(state.selections).toEqual({ motive: "M1" });
    expect(state.view).toBe("editor");
    expect(state.result).toBeNull();
  });
});
