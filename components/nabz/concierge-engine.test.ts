import { describe, expect, it } from "vitest";
import { createEmptyNabzSession, recordDuelChoice } from "./nabz-engine";
import {
  parseConciergeInput,
  rankConciergePlaces,
} from "./concierge-engine";
import { NABZ_DEMO_PLACES, NABZ_SCENARIOS } from "./nabz-demo-data";

function completeDateSession() {
  const scenario = NABZ_SCENARIOS.find((item) => item.id === "date");
  if (!scenario) {
    throw new Error("Date scenario fixture missing");
  }

  return scenario.duels.reduce((session, duel) => {
    const result = recordDuelChoice(session, duel, duel.options[0]);
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result.session;
  }, createEmptyNabzSession("date"));
}

describe("parseConciergeInput", () => {
  it("accepts the five bounded concierge inputs", () => {
    expect(
      parseConciergeInput({
        occasion: "date",
        budget: "متوسط",
        group: "pair",
        neighborhood: "گلسار",
        priorities: ["cozy", "quiet"],
      }),
    ).toEqual({
      ok: true,
      value: {
        occasion: "date",
        budget: "متوسط",
        group: "pair",
        neighborhood: "گلسار",
        priorities: ["cozy", "quiet"],
      },
    });
  });

  it("rejects unknown fields and duplicate or excessive priorities", () => {
    const result = parseConciergeInput({
      occasion: "date",
      budget: "هر بودجه‌ای",
      group: "pair",
      neighborhood: "همه محله‌ها",
      priorities: ["cozy", "cozy", "quiet", "value"],
      hiddenRating: 5,
    });

    expect(result.ok).toBe(false);
  });
});

describe("rankConciergePlaces", () => {
  it("ranks matches with explanations linked to supporting taste evidence", () => {
    const result = rankConciergePlaces(
      completeDateSession(),
      {
        occasion: "date",
        budget: "متوسط",
        group: "pair",
        neighborhood: "گلسار",
        priorities: ["cozy", "quiet"],
      },
      NABZ_DEMO_PLACES,
      3,
    );

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      return;
    }

    expect(result.recommendations).toHaveLength(3);
    expect(result.recommendations[0]?.place.id).toBe("baran");
    expect(result.recommendations[0]?.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "taste",
          evidenceHref: expect.stringMatching(/^#taste-evidence-/),
        }),
        expect.objectContaining({ kind: "neighborhood" }),
      ]),
    );
  });

  it("withholds recommendations when fewer than three choices exist", () => {
    const scenario = NABZ_SCENARIOS[0];
    const twoChoices = scenario.duels.slice(0, 2).reduce((session, duel) => {
      const result = recordDuelChoice(session, duel, duel.options[0]);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.session;
    }, createEmptyNabzSession(scenario.id));

    expect(
      rankConciergePlaces(
        twoChoices,
        {
          occasion: "date",
          budget: "any",
          group: "pair",
          neighborhood: "any",
          priorities: [],
        },
        NABZ_DEMO_PLACES,
        3,
      ),
    ).toEqual({
      status: "insufficient_evidence",
      currentEvidence: 2,
      requiredEvidence: 3,
      message: "داده کافی نداریم؛ حداقل ۳ انتخاب لازم است.",
    });
  });
});
