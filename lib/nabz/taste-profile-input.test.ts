import { describe, expect, it } from "vitest";
import {
  chooseFreshTasteProfile,
  parseStoredTasteProfile,
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

describe("stored taste profile", () => {
  const currentProfile = {
    modelId: "nazarato-taste-graph" as const,
    modelVersion: "0.1.0" as const,
    scores: { cozy: 14, quiet: 9, value: 4, local: 3, social: 1, service: 8 },
    evidenceCount: 5,
    updatedAt: "2026-09-06T10:30:00.000Z",
  };

  it("returns only the current model aggregate as a normalized UI profile", () => {
    expect(
      parseStoredTasteProfile({
        model_id: "nazarato-taste-graph",
        model_version: "0.1.0",
        dimension_weights: {
          cozy: 14,
          quiet: 9,
          value: 4,
          local: 3,
          social: 1,
          service: 8,
          future_dimension: 99,
        },
        evidence_count: 5,
        updated_at: "2026-09-06T10:30:00+00:00",
      }),
    ).toEqual({
      ok: true,
      value: {
        modelId: "nazarato-taste-graph",
        modelVersion: "0.1.0",
        scores: {
          cozy: 14,
          quiet: 9,
          value: 4,
          local: 3,
          social: 1,
          service: 8,
        },
        evidenceCount: 5,
        updatedAt: "2026-09-06T10:30:00.000Z",
      },
    });
  });

  it("fails closed for stale models, malformed weights, or invalid metadata", () => {
    const validRow = {
      model_id: "nazarato-taste-graph",
      model_version: "0.1.0",
      dimension_weights: {
        cozy: 14,
        quiet: 9,
        value: 4,
        local: 3,
        social: 1,
        service: 8,
      },
      evidence_count: 5,
      updated_at: "2026-09-06T10:30:00.000Z",
    };

    expect(
      parseStoredTasteProfile({ ...validRow, model_version: "0.0.9" }),
    ).toEqual(expect.objectContaining({ ok: false }));
    expect(
      parseStoredTasteProfile({
        ...validRow,
        dimension_weights: { ...validRow.dimension_weights, cozy: Number.NaN },
      }),
    ).toEqual(expect.objectContaining({ ok: false }));
    expect(
      parseStoredTasteProfile({ ...validRow, evidence_count: 6 }),
    ).toEqual(expect.objectContaining({ ok: false }));
    expect(
      parseStoredTasteProfile({ ...validRow, updated_at: "not-a-date" }),
    ).toEqual(expect.objectContaining({ ok: false }));
  });

  it("keeps a newer client-confirmed save over a late profile read", () => {
    expect(chooseFreshTasteProfile(currentProfile, null)).toBe(currentProfile);
    expect(
      chooseFreshTasteProfile(currentProfile, {
        ...currentProfile,
        evidenceCount: 2,
        updatedAt: "2026-09-06T10:29:00.000Z",
      }),
    ).toBe(currentProfile);
  });

  it("accepts a newer account read over an older local value", () => {
    const newer = {
      ...currentProfile,
      updatedAt: "2026-09-06T10:31:00.000Z",
    };
    expect(chooseFreshTasteProfile(currentProfile, newer)).toBe(newer);
  });
});
