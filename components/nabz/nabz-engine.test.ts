import { describe, expect, it } from "vitest";
import {
  buildTasteEvidence,
  createEmptyNabzSession,
  recordDuelChoice,
  summarizeTaste,
} from "./nabz-engine";
import { NABZ_DEMO_PLACES, NABZ_SCENARIOS } from "./nabz-demo-data";

describe("recordDuelChoice", () => {
  it("records five valid choices and builds an explainable taste profile", () => {
    const scenario = NABZ_SCENARIOS[0];
    const session = scenario.duels.reduce((current, duel) => {
      const result = recordDuelChoice(current, duel, duel.options[0], "فضای دنج");

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return current;
      }

      return result.session;
    }, createEmptyNabzSession(scenario.id));

    expect(session.choices).toHaveLength(5);
    expect(session.choices.every((choice) => choice.reason === "فضای دنج")).toBe(true);

    const summary = summarizeTaste(session.scores);
    expect(summary.primary.score).toBeGreaterThan(0);
    expect(summary.secondary.score).toBeGreaterThanOrEqual(0);
  });

  it("rejects a place that is not part of the active duel without mutating the session", () => {
    const scenario = NABZ_SCENARIOS[0];
    const session = createEmptyNabzSession(scenario.id);
    const duel = scenario.duels[0];
    const outsider = NABZ_DEMO_PLACES.find(
      (place) => !duel.options.includes(place.id),
    );

    expect(outsider).toBeDefined();
    if (!outsider) {
      return;
    }

    const result = recordDuelChoice(session, duel, outsider.id);

    expect(result).toEqual({
      ok: false,
      error: "این گزینه در دوئل فعلی نیست.",
    });
    expect(session).toEqual(createEmptyNabzSession(scenario.id));
  });

  it("weights the same place differently for different scenarios", () => {
    const sharedDuel = {
      id: "shared-duel",
      prompt: "یک انتخاب مشترک",
      options: ["baran", "kaghaz"] as const,
    };
    const dateResult = recordDuelChoice(
      createEmptyNabzSession("date"),
      sharedDuel,
      "baran",
    );
    const laptopResult = recordDuelChoice(
      createEmptyNabzSession("laptop"),
      sharedDuel,
      "baran",
    );

    expect(dateResult.ok).toBe(true);
    expect(laptopResult.ok).toBe(true);
    if (!dateResult.ok || !laptopResult.ok) {
      return;
    }

    expect(dateResult.session.scores.cozy).toBeGreaterThan(
      laptopResult.session.scores.cozy,
    );
    expect(laptopResult.session.scores.quiet).toBeGreaterThan(
      dateResult.session.scores.quiet,
    );
  });

  it("explains each taste dimension with the exact choices that shaped it", () => {
    const scenario = NABZ_SCENARIOS[0];
    const firstDuel = scenario.duels[0];
    const result = recordDuelChoice(
      createEmptyNabzSession(scenario.id),
      firstDuel,
      firstDuel.options[0],
      "برای گفت‌وگو بهتر بود",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const evidence = buildTasteEvidence(result.session, scenario);
    expect(evidence[0]?.sources[0]).toEqual(
      expect.objectContaining({
        duelId: firstDuel.id,
        prompt: firstDuel.prompt,
        placeId: firstDuel.options[0],
        reason: "برای گفت‌وگو بهتر بود",
      }),
    );
  });
});
