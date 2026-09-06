import { describe, expect, it, vi } from "vitest";
import {
  loadLiveNabzDuel,
  submitLiveNabzVote,
  type NabzFetch,
} from "./live-duel-client";

const first = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "cafe-one",
  name: "کافه یک",
  kind: "کافه",
  neighborhoodSlug: "golsar",
  priceBand: 2,
};

const second = {
  id: "00000000-0000-4000-8000-000000000002",
  slug: "restaurant-two",
  name: "رستوران دو",
  kind: "رستوران",
  neighborhoodSlug: null,
  priceBand: null,
};

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

describe("loadLiveNabzDuel", () => {
  it("accepts a matching real pair with enough supply for five rounds", async () => {
    const fetcher = vi.fn<NabzFetch>().mockResolvedValue(
      jsonResponse({
        ok: true,
        status: "ready",
        scenario: "date",
        round: 0,
        availablePairCount: 5,
        pair: {
          prompt: "برای قرار دونفره کدام را انتخاب می‌کنی؟",
          options: [first, second],
        },
      }),
    );

    await expect(loadLiveNabzDuel("date", 0, fetcher)).resolves.toEqual({
      ok: true,
      duel: expect.objectContaining({
        scenario: "date",
        round: 0,
        availablePairCount: 5,
        options: [first, second],
      }),
    });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/nabz/duel?scenario=date&round=0",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("fails closed for malformed, mismatched, duplicate, or short-deck responses", async () => {
    const responses = [
      { ok: true, status: "ready", scenario: "budget", round: 0 },
      {
        ok: true,
        status: "ready",
        scenario: "date",
        round: 0,
        availablePairCount: 5,
        pair: { prompt: "تکراری", options: [first, first] },
      },
      {
        ok: true,
        status: "ready",
        scenario: "date",
        round: 0,
        availablePairCount: 4,
        pair: { prompt: "کوتاه", options: [first, second] },
      },
    ];

    for (const body of responses) {
      const fetcher = vi.fn<NabzFetch>().mockResolvedValue(jsonResponse(body));
      await expect(loadLiveNabzDuel("date", 0, fetcher)).resolves.toEqual(
        expect.objectContaining({ ok: false }),
      );
    }
  });

  it("distinguishes honest supply exhaustion from a transport failure", async () => {
    const insufficient = vi.fn<NabzFetch>().mockResolvedValue(
      jsonResponse({
        ok: true,
        status: "insufficient_supply",
        scenario: "date",
        round: 0,
        availablePairCount: 0,
        message: "داده کافی نداریم.",
      }),
    );
    const unavailable = vi.fn<NabzFetch>().mockRejectedValue(new Error("offline"));

    await expect(loadLiveNabzDuel("date", 0, insufficient)).resolves.toEqual({
      ok: false,
      reason: "insufficient_supply",
    });
    await expect(loadLiveNabzDuel("date", 0, unavailable)).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
  });
});

describe("submitLiveNabzVote", () => {
  it("posts only the selected real pair and accepts an idempotent success", async () => {
    const fetcher = vi.fn<NabzFetch>().mockResolvedValue(
      jsonResponse({ ok: true, stored: false, duplicate: true }),
    );

    await expect(
      submitLiveNabzVote(
        {
          scenario: "date",
          winnerBusinessId: first.id,
          loserBusinessId: second.id,
          reasonText: "فضای آرام‌تر",
        },
        fetcher,
      ),
    ).resolves.toEqual({ ok: true, stored: false, duplicate: true });

    expect(fetcher).toHaveBeenCalledWith(
      "/api/nabz/votes",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          citySlug: "rasht",
          scenarioSlug: "date",
          winnerBusinessId: first.id,
          loserBusinessId: second.id,
          reasonText: "فضای آرام‌تر",
        }),
      }),
    );
  });

  it("does not treat malformed or rejected vote responses as success", async () => {
    const malformed = vi
      .fn<NabzFetch>()
      .mockResolvedValue(jsonResponse({ ok: true, stored: "yes" }));
    const rejected = vi
      .fn<NabzFetch>()
      .mockResolvedValue(jsonResponse({ ok: false }, 422));

    await expect(
      submitLiveNabzVote(
        {
          scenario: "date",
          winnerBusinessId: first.id,
          loserBusinessId: second.id,
        },
        malformed,
      ),
    ).resolves.toEqual({ ok: false });
    await expect(
      submitLiveNabzVote(
        {
          scenario: "date",
          winnerBusinessId: first.id,
          loserBusinessId: second.id,
        },
        rejected,
      ),
    ).resolves.toEqual({ ok: false });
  });
});
