import { describe, expect, it } from "vitest";
import {
  createEmptyNabzSession,
  getNabzRecommendations,
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
    const recommendations = getNabzRecommendations(
      NABZ_DEMO_PLACES,
      session.scores,
      3,
    );

    expect(summary.primary.score).toBeGreaterThan(0);
    expect(summary.secondary.score).toBeGreaterThanOrEqual(0);
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].reasons).not.toHaveLength(0);
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
});
