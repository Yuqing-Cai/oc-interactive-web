import { describe, expect, it } from "vitest";

import {
  AXES,
  AXIS_CONNECTIONS,
  detectGenerationMode,
  getAxis,
  getOption,
  optionBelongsToAxis,
} from "./axes";
import { DOMAIN_SCHEMA_VERSION, LOCALES } from "./schema";

const EXPECTED_AXIS_IDS = [
  "world",
  "body",
  "power",
  "role",
  "motive",
  "choice",
  "expression",
  "judgment",
  "sanity",
  "dynamic",
  "love",
  "achilles",
  "heroine",
  "time",
  "exchange",
  "finale",
  "palette",
] as const;

const EXPECTED_OPTION_COUNTS = [6, 3, 3, 3, 4, 3, 5, 3, 3, 3, 5, 3, 4, 4, 3, 4, 8];

describe("axis domain data", () => {
  it("uses the v3 schema and stable axis ordering", () => {
    expect(DOMAIN_SCHEMA_VERSION).toBe("3.0.0");
    expect(AXES.map((axis) => axis.id)).toEqual(EXPECTED_AXIS_IDS);
    expect(AXES.map((axis) => axis.order)).toEqual(
      AXES.map((_, index) => index),
    );
    expect(AXES.map((axis) => axis.options.length)).toEqual(
      EXPECTED_OPTION_COUNTS,
    );
  });

  it("contains all 17 axes and all 67 options exactly once", () => {
    const axisIds = AXES.map((axis) => axis.id);
    const axisCodes = AXES.map((axis) => axis.code);
    const optionIds = AXES.flatMap((axis) =>
      axis.options.map((option) => option.id),
    );

    expect(AXES).toHaveLength(17);
    expect(optionIds).toHaveLength(67);
    expect(new Set(axisIds).size).toBe(axisIds.length);
    expect(new Set(axisCodes).size).toBe(axisCodes.length);
    expect(new Set(optionIds).size).toBe(optionIds.length);
  });

  it("keeps locale-independent IDs separate from complete localized copy", () => {
    for (const axis of AXES) {
      expect(axis.id).toMatch(/^[a-z]+$/);
      expect(axis.options.map((option) => option.order)).toEqual(
        axis.options.map((_, index) => index),
      );

      for (const locale of LOCALES) {
        const copy = axis.copy[locale];
        expect(copy.label).not.toBe("");
        expect(copy.description).not.toBe("");
        expect(copy.wisdom).not.toBe("");
        expect(copy.intro).not.toBe("");
        if (axis.kind === "palette") {
          expect(copy.links).toBe("");
        } else {
          expect(copy.links).not.toBe("");
        }
      }

      for (const option of axis.options) {
        if (axis.kind === "structure") {
          expect(option.id).toMatch(new RegExp(`^${axis.code}\\d+$`));
          expect(option.copy.zh.label.startsWith(option.id)).toBe(true);
          expect(option.copy.en.label.startsWith(option.id)).toBe(true);
        } else {
          expect(option.id).toMatch(/^PAL\d+$/);
        }

        for (const locale of LOCALES) {
          expect(Object.values(option.copy[locale]).every(Boolean)).toBe(true);
        }
      }
    }

    expect(AXIS_CONNECTIONS.zh).toContain("W（世界）→ C（抉择）");
    expect(AXIS_CONNECTIONS.en).toContain("W (World) → C (Choice)");
  });

  it("resolves axes and options without using display labels as keys", () => {
    expect(getAxis("world").code).toBe("W");
    expect(getOption("W1").copy.zh.label).toBe("W1 铁律之笼");
    expect(getOption("PAL1").copy.en.label).toBe("Cold Restraint");
    expect(optionBelongsToAxis("world", "W1")).toBe(true);
    expect(optionBelongsToAxis("body", "W1")).toBe(false);
  });

  it("derives generation mode from stable axis IDs", () => {
    expect(
      detectGenerationMode([
        { axisId: "world", optionId: "W1" },
        { axisId: "choice", optionId: "C1" },
        { axisId: "palette", optionId: "PAL1" },
      ]),
    ).toBe("opening");

    expect(
      detectGenerationMode([
        { axisId: "world", optionId: "W1" },
        { axisId: "time", optionId: "T1" },
      ]),
    ).toBe("timeline");
  });
});
