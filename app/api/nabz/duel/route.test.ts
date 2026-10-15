import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getBusinessPool: vi.fn(),
}));

vi.mock("../../../../lib/nabz/supabase-business-pool", () => ({
  getSupabaseNabzBusinessPool: mocks.getBusinessPool,
}));

import { GET } from "./route";

describe("GET /api/nabz/duel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an unsupported scenario before reading the database", async () => {
    const response = await GET(
      new Request("http://localhost/api/nabz/duel?scenario=unknown&round=0"),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ ok: false, error: "درخواست دوئل معتبر نیست." }),
    );
    expect(mocks.getBusinessPool).not.toHaveBeenCalled();
  });

  it("returns an honest insufficient-supply response without demo businesses", async () => {
    mocks.getBusinessPool.mockResolvedValue({
      status: "insufficient_supply",
      businesses: [],
      summary: {
        eligibleBusinessCount: 0,
        duelReadyBusinessCount: 0,
        recommendationReadyBusinessCount: 0,
        requiredDuelBusinesses: 2,
        requiredRecommendationEvidence: 3,
      },
      message: "داده کافی نداریم.",
    });

    const response = await GET(
      new Request("http://localhost/api/nabz/duel?scenario=date&round=0"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        ok: true,
        status: "insufficient_supply",
        availablePairCount: 0,
      }),
    );
  });

  it("returns 503 without leaking database details when the pool is unavailable", async () => {
    mocks.getBusinessPool.mockResolvedValue({
      status: "unavailable",
      summary: {
        eligibleBusinessCount: 0,
        duelReadyBusinessCount: 0,
        recommendationReadyBusinessCount: 0,
        requiredDuelBusinesses: 2,
        requiredRecommendationEvidence: 3,
      },
      message: "private database detail",
    });

    const response = await GET(
      new Request("http://localhost/api/nabz/duel?scenario=date&round=0"),
    );

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toEqual({
      ok: false,
      error: "ساخت دوئل واقعی فعلاً ممکن نیست؛ کمی بعد دوباره تلاش کن.",
    });
    expect(JSON.stringify(body)).not.toContain("private database detail");
  });
});
