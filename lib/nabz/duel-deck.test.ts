import { describe, expect, it } from "vitest";
import type { NabzBusinessPoolCandidate } from "./business-pool";
import {
  buildNabzDuel,
  parseNabzDuelQuery,
} from "./duel-deck";

function candidate(
  id: string,
  overrides: Partial<NabzBusinessPoolCandidate> = {},
): NabzBusinessPoolCandidate {
  return {
    id,
    slug: `business-${id}`,
    name: `کسب‌وکار ${id}`,
    kind: "کافه",
    neighborhoodSlug: "golsar",
    priceBand: 2,
    sourceFacts: ["name", "category", "city", "neighborhood"],
    comparisonEvidenceCount: 0,
    reviewEvidenceCount: 0,
    firstPartyEvidenceCount: 0,
    duelReady: true,
    recommendationReady: false,
    ...overrides,
  };
}

describe("parseNabzDuelQuery", () => {
  it("accepts one supported scenario and a round from zero through four", () => {
    expect(
      parseNabzDuelQuery(new URLSearchParams("scenario=date&round=4")),
    ).toEqual({ ok: true, value: { scenario: "date", round: 4 } });
  });

  it.each([
    "scenario=unknown&round=0",
    "scenario=date&round=5",
    "scenario=date&round=-1",
    "scenario=date&round=1.5",
    "scenario=date&round=0&debug=true",
    "scenario=date&scenario=laptop&round=0",
  ])("rejects unsupported or ambiguous query input: %s", (query) => {
    expect(parseNabzDuelQuery(new URLSearchParams(query))).toEqual(
      expect.objectContaining({ ok: false }),
    );
  });
});

describe("buildNabzDuel", () => {
  const today = new Date("2026-09-07T10:00:00.000Z");

  it("returns five deterministic, unique pairs containing public fields only", () => {
    const businesses = [
      candidate("a"),
      candidate("b", { kind: "رستوران", priceBand: 3 }),
      candidate("c"),
      candidate("d"),
    ];

    const rounds = Array.from({ length: 5 }, (_, round) =>
      buildNabzDuel({ businesses, scenario: "date", round, now: today }),
    );
    const readyRounds = rounds.filter((result) => result.status === "ready");
    const pairKeys = readyRounds.map((result) =>
      result.pair.options.map((option) => option.id).sort().join(":"),
    );

    expect(readyRounds).toHaveLength(5);
    expect(new Set(pairKeys).size).toBe(5);
    expect(
      buildNabzDuel({ businesses, scenario: "date", round: 2, now: today }),
    ).toEqual(rounds[2]);
    expect(readyRounds[0]?.pair.options[0]).toEqual({
      id: expect.any(String),
      slug: expect.any(String),
      name: expect.any(String),
      kind: expect.stringMatching(/^(کافه|رستوران)$/),
      neighborhoodSlug: "golsar",
      priceBand: expect.any(Number),
    });
    expect(readyRounds[0]?.pair.options[0]).not.toHaveProperty("sourceFacts");
    expect(readyRounds[0]?.pair.options[0]).not.toHaveProperty(
      "reviewEvidenceCount",
    );
  });

  it("drops ineligible and duplicate candidates, then reports exhausted supply honestly", () => {
    const businesses = [
      candidate("a"),
      candidate("a", { name: "duplicate" }),
      candidate("b"),
      candidate("hidden", { duelReady: false }),
    ];

    expect(
      buildNabzDuel({ businesses, scenario: "budget", round: 0, now: today }),
    ).toEqual(expect.objectContaining({ status: "ready", availablePairCount: 1 }));
    expect(
      buildNabzDuel({ businesses, scenario: "budget", round: 1, now: today }),
    ).toEqual(
      expect.objectContaining({
        status: "insufficient_supply",
        availablePairCount: 1,
        message: expect.stringContaining("داده کافی نداریم"),
      }),
    );
  });
});
