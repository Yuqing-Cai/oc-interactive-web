import { describe, expect, it } from "vitest";

import type { FateSelection } from "./axes";
import {
  CAUSALITY_BRANCH_LIMIT,
  deriveCausality,
} from "./causality";

const select = (
  axisId: FateSelection["axisId"],
  optionId: FateSelection["optionId"],
): FateSelection => ({ axisId, optionId });

describe("causality rule engine", () => {
  it("builds the fixed bilingual fate spine only from selected axes", () => {
    const selections = [
      select("world", "W1"),
      select("motive", "M1"),
      select("choice", "C1"),
      select("body", "B1"),
      select("time", "T1"),
      select("power", "P2"),
      select("exchange", "X1"),
      select("finale", "F2"),
    ];

    const zh = deriveCausality(selections, "zh");
    const en = deriveCausality(selections, "en");

    expect(zh.status).toBe("closed");
    expect(zh.trunk.map((relation) => relation.id)).toEqual([
      "world-choice",
      "motive-choice",
      "body-time",
      "choice-exchange",
      "power-exchange",
      "time-finale",
      "exchange-finale",
    ]);
    expect(zh.trunk[0]?.text).toContain("W1 铁律之笼");
    expect(zh.trunk[0]?.text).toContain("C1 坚守至击碎");
    expect(zh.trunk[3]?.text).toContain("成为这次抉择付出的代价");
    expect(en.trunk[3]?.text).toContain("the cost of that choice");
    expect(en.trunk[6]?.text).toContain("F2 Ordinary Life");
    expect(zh.gaps).toEqual([]);
  });

  it("returns at most three branches in stable semantic priority", () => {
    const result = deriveCausality(
      [
        select("motive", "M2"),
        select("exchange", "X3"),
        select("role", "R1"),
        select("heroine", "H1"),
        select("dynamic", "D3"),
        select("expression", "E1"),
        select("judgment", "J2"),
        select("sanity", "S2"),
        select("love", "L1"),
        select("achilles", "A2"),
      ],
      "zh",
    );

    expect(result.branches).toHaveLength(CAUSALITY_BRANCH_LIMIT);
    expect(result.branches.map((relation) => relation.id)).toEqual([
      "motive-exchange",
      "role-heroine-dynamic",
      "expression-judgment",
    ]);
    expect(result.branches[0]?.kind).toBe("reciprocal");
    expect(result.branches[1]?.sources.map((node) => node.axisId)).toEqual([
      "role",
      "heroine",
    ]);
    expect(result.branches[2]?.outcome).toBe("沟通模式");
  });

  it("combines selected expression and judgment targets into one sanity branch", () => {
    const both = deriveCausality(
      [
        select("sanity", "S3"),
        select("expression", "E2"),
        select("judgment", "J3"),
      ],
      "en",
    );
    const sanity = both.branches.find(
      (relation) => relation.id === "sanity-communication",
    );

    expect(sanity?.kind).toBe("constraint");
    expect(sanity?.targets.map((node) => node.axisId)).toEqual([
      "expression",
      "judgment",
    ]);
    expect(sanity?.text).toContain("limits the stability");

    const judgmentOnly = deriveCausality(
      [select("sanity", "S2"), select("judgment", "J1")],
      "zh",
    );
    expect(judgmentOnly.branches[0]?.targets.map((node) => node.axisId)).toEqual([
      "judgment",
    ]);
    expect(judgmentOnly.branches[0]?.text).not.toContain("表达");
  });

  it("derives heroine-to-love and love-plus-achilles relationship branches", () => {
    const result = deriveCausality(
      [
        select("heroine", "H2"),
        select("love", "L2"),
        select("achilles", "A1"),
      ],
      "zh",
    );

    expect(result.branches.map((relation) => relation.id)).toEqual([
      "love-achilles",
      "heroine-love",
    ]);
    expect(result.branches[0]).toMatchObject({
      kind: "co-created",
      outcome: "关系深度",
    });
    expect(result.branches[1]).toMatchObject({
      kind: "directed",
      outcome: null,
    });
    expect(result.branches[1]?.text).toContain("推动");
  });

  it("identifies forward and reverse gaps without inventing relations", () => {
    const forward = deriveCausality(
      [select("world", "W2"), select("body", "B1")],
      "zh",
    );
    expect(forward.trunk).toEqual([]);
    expect(forward.gaps.map((gap) => gap.id)).toEqual(["choice", "time"]);
    expect(forward.gaps[0]?.missingAxisIds).toEqual(["choice"]);

    const downstream = deriveCausality(
      [select("choice", "C2"), select("finale", "F4")],
      "en",
    );
    expect(downstream.gaps.map((gap) => gap.id)).toEqual([
      "origin",
      "exchange",
      "finale-source",
    ]);
    expect(downstream.gaps[0]).toMatchObject({
      missingAxisIds: ["world", "motive"],
      mode: "any",
    });
    expect(downstream.gaps[2]).toMatchObject({
      missingAxisIds: ["exchange", "time"],
      mode: "any",
    });
  });

  it("keeps Palette outside causality and reports an empty state", () => {
    const result = deriveCausality([select("palette", "PAL1")], "zh");

    expect(result.status).toBe("empty");
    expect(result.selected).toEqual([]);
    expect(result.trunk).toEqual([]);
    expect(result.branches).toEqual([]);
    expect(result.gaps).toEqual([]);
    expect(result.summary).toContain("尚未形成联动");
  });

  it("is independent of input order and uses the last duplicate selection", () => {
    const ordered = deriveCausality(
      [
        select("world", "W1"),
        select("choice", "C1"),
        select("exchange", "X1"),
      ],
      "zh",
    );
    const reordered = deriveCausality(
      [
        select("exchange", "X1"),
        select("choice", "C1"),
        select("world", "W1"),
      ],
      "zh",
    );
    expect(reordered).toEqual(ordered);

    const duplicate = deriveCausality(
      [select("world", "W1"), select("world", "W3")],
      "en",
    );
    expect(duplicate.selected).toHaveLength(1);
    expect(duplicate.selected[0]?.optionId).toBe("W3");
  });

  it("rejects option IDs that do not belong to their axis", () => {
    expect(() => deriveCausality([select("body", "W1")], "zh")).toThrow(
      "Option W1 does not belong to axis body",
    );
  });
});
