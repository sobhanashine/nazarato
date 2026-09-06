import { describe, expect, it } from "vitest";
import {
  parseTasteProfileInput,
  rebuildTasteProfileSession,
} from "./taste-profile-input";

describe("taste profile input", () => {
  it("rebuilds trusted weights from valid duel choices", () => {
    const parsed = parseTasteProfileInput({
      scenarioId: "date",
      selectedPlaceIds: ["baran", "toranj", "kaghaz"],
    });

    expect(parsed).toEqual({
      ok: true,
      value: {
        scenarioId: "date",
        selectedPlaceIds: ["baran", "toranj", "kaghaz"],
      },
    });
    if (parsed.ok) {
      const session = rebuildTasteProfileSession(parsed.value);
      expect(session?.choices).toHaveLength(3);
      expect(session?.scores.cozy).toBeGreaterThan(0);
    }
  });

  it("rejects forged scores, unknown fields, and choices from the wrong duel", () => {
    expect(
      parseTasteProfileInput({
        scenarioId: "date",
        selectedPlaceIds: ["baran"],
        scores: { cozy: 9999 },
      }),
    ).toEqual(expect.objectContaining({ ok: false }));

    expect(
      parseTasteProfileInput({
        scenarioId: "date",
        selectedPlaceIds: ["istgah"],
      }),
    ).toEqual(expect.objectContaining({ ok: false }));
  });
});
