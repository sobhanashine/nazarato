import { describe, expect, it } from "vitest";
import {
  evaluateNabzBusinessPool,
  loadNabzBusinessPool,
  type NabzBusinessPoolRepository,
} from "./business-pool";

const approvedSource = (fieldPayload: Record<string, unknown>) => ({
  status: "approved",
  field_payload: fieldPayload,
});

const rashtBusiness = (
  id: string,
  overrides: Record<string, unknown> = {},
) => ({
  id,
  slug: `business-${id}`,
  name: `کسب‌وکار ${id}`,
  category_slug: "cafe",
  city: "رشت",
  status: "active",
  neighborhood_slug: "golsar",
  latitude: 37.28,
  longitude: 49.58,
  price_band: 2,
  business_sources: [
    approvedSource({
      name: `کسب‌وکار ${id}`,
      category_slug: "cafe",
      city: "رشت",
      neighborhood_slug: "golsar",
      latitude: 37.28,
      longitude: 49.58,
      price_band: 2,
    }),
  ],
  ...overrides,
});

describe("evaluateNabzBusinessPool", () => {
  it("builds a duel-ready pool and marks only sufficiently evidenced businesses recommendation-ready", () => {
    const result = evaluateNabzBusinessPool({
      businesses: [rashtBusiness("a"), rashtBusiness("b")],
      votes: [
        { winner_business_id: "a", loser_business_id: "b", weight: 1 },
        { winner_business_id: "a", loser_business_id: "b", weight: 0.8 },
        {
          winner_business_id: "a",
          loser_business_id: "b",
          weight: 1,
          moderation_status: "flagged",
        },
        { winner_business_id: "a", loser_business_id: "outside", weight: 1 },
      ],
      reviewEvidence: [
        {
          business_id: "a",
          review_analyses: [
            {
              confidence: 0.76,
              human_status: "unreviewed",
              is_active: true,
            },
          ],
        },
        {
          business_id: "a",
          review_analyses: [
            {
              confidence: 0.92,
              human_status: "rejected",
              is_active: true,
            },
          ],
        },
        {
          business_id: "b",
          review_analyses: [
            {
              confidence: 0.3,
              human_status: "confirmed",
              is_active: true,
            },
          ],
        },
      ],
    });

    expect(result.status).toBe("ready");
    expect(result.summary).toEqual({
      eligibleBusinessCount: 2,
      duelReadyBusinessCount: 2,
      recommendationReadyBusinessCount: 1,
      requiredDuelBusinesses: 2,
      requiredRecommendationEvidence: 3,
    });
    expect(result.businesses).toEqual([
      expect.objectContaining({
        id: "a",
        kind: "کافه",
        duelReady: true,
        recommendationReady: true,
        comparisonEvidenceCount: 2,
        reviewEvidenceCount: 1,
        firstPartyEvidenceCount: 3,
      }),
      expect.objectContaining({
        id: "b",
        duelReady: true,
        recommendationReady: false,
        firstPartyEvidenceCount: 2,
      }),
    ]);
  });

  it("fails closed for quarantined, mismatched, context-free, or malformed source evidence", () => {
    const result = evaluateNabzBusinessPool({
      businesses: [
        rashtBusiness("quarantined", {
          business_sources: [
            {
              status: "quarantined",
              field_payload: {
                name: "کسب‌وکار quarantined",
                category_slug: "cafe",
                city: "رشت",
                neighborhood_slug: "golsar",
              },
            },
          ],
        }),
        rashtBusiness("mismatch", {
          business_sources: [
            approvedSource({
              name: "یک نام دیگر",
              category_slug: "cafe",
              city: "رشت",
              neighborhood_slug: "golsar",
            }),
          ],
        }),
        rashtBusiness("context-free", {
          neighborhood_slug: null,
          latitude: null,
          longitude: null,
          price_band: null,
          business_sources: [
            approvedSource({
              name: "کسب‌وکار context-free",
              category_slug: "cafe",
              city: "رشت",
            }),
          ],
        }),
        { id: "malformed" },
      ],
      votes: [],
      reviewEvidence: [],
    });

    expect(result.status).toBe("insufficient_supply");
    expect(result.summary).toEqual(
      expect.objectContaining({
        eligibleBusinessCount: 1,
        duelReadyBusinessCount: 0,
        recommendationReadyBusinessCount: 0,
      }),
    );
    expect(result.businesses).toEqual([
      expect.objectContaining({ id: "context-free", duelReady: false }),
    ]);
    expect(result.message).toContain("داده کافی نداریم");
  });
});

describe("loadNabzBusinessPool", () => {
  it("returns unavailable instead of leaking partial results when a repository read fails", async () => {
    const repository: NabzBusinessPoolRepository = {
      listBusinesses: async () => {
        throw new Error("database unavailable");
      },
      listAcceptedVotes: async () => [],
      listReviewEvidence: async () => [],
    };

    await expect(loadNabzBusinessPool(repository)).resolves.toEqual({
      status: "unavailable",
      summary: {
        eligibleBusinessCount: 0,
        duelReadyBusinessCount: 0,
        recommendationReadyBusinessCount: 0,
        requiredDuelBusinesses: 2,
        requiredRecommendationEvidence: 3,
      },
      message: "وضعیت داده‌های واقعی فعلاً قابل بررسی نیست.",
    });
  });
});
