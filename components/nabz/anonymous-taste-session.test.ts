import { describe, expect, it } from "vitest";
import { createEmptyNabzSession, recordDuelChoice } from "./nabz-engine";
import {
  ANONYMOUS_TASTE_TTL_MS,
  restoreAnonymousTasteSession,
  serializeAnonymousTasteSession,
} from "./anonymous-taste-session";
import { NABZ_SCENARIOS } from "./nabz-demo-data";

describe("anonymous taste session", () => {
  it("round-trips choices for seven days without persisting free-text reasons", () => {
    const scenario = NABZ_SCENARIOS[0];
    const firstDuel = scenario.duels[0];
    const result = recordDuelChoice(
      createEmptyNabzSession(scenario.id),
      firstDuel,
      firstDuel.options[0],
      "این متن نباید ذخیره شود",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const now = Date.parse("2026-09-03T08:00:00.000Z");
    const serialized = serializeAnonymousTasteSession(result.session, now);
    const restored = restoreAnonymousTasteSession(serialized, now + 1_000);

    expect(serialized).not.toContain("این متن نباید ذخیره شود");
    expect(restored?.choices).toHaveLength(1);
    expect(restored?.choices[0]?.reason).toBeUndefined();
    expect(
      restoreAnonymousTasteSession(serialized, now + ANONYMOUS_TASTE_TTL_MS + 1),
    ).toBeNull();
  });

  it("rejects tampered place IDs instead of trusting stored scores", () => {
    const tampered = JSON.stringify({
      version: 1,
      savedAt: Date.parse("2026-09-03T08:00:00.000Z"),
      scenarioId: "date",
      selectedPlaceIds: ["real-looking-but-unknown"],
    });

    expect(
      restoreAnonymousTasteSession(
        tampered,
        Date.parse("2026-09-03T09:00:00.000Z"),
      ),
    ).toBeNull();
  });
});
