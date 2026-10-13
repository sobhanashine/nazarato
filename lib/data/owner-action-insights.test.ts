import { describe, expect, it } from "vitest";
import {
  buildOwnerActionInsights,
  calculateNegativeBaseline,
  type OwnerAnalyzedReview,
} from "./owner-action-insights";

function review(
  id: string,
  options: Partial<OwnerAnalyzedReview> = {},
): OwnerAnalyzedReview {
  return {
    id,
    body: "قهوه عالی بود و برخورد پرسنل خوب بود.",
    createdAt: `2026-09-0${id.length}T10:00:00.000Z`,
    rating: 5,
    analysis: {
      modelId: "nazarato-fa-rules",
      modelVersion: "0.1.0",
      sentiment: "positive",
      aspectScores: {
        taste: {
          mentions: 2,
          positive: 2,
          negative: 0,
          net: 1,
          confidence: 0.72,
        },
      },
      evidenceSpans: [
        {
          aspect: "taste",
          polarity: "positive",
          start: 5,
          end: 9,
          excerpt: "عالی",
          cue: "عالی",
        },
      ],
      issueCluster: null,
      confidence: 0.75,
      humanStatus: "unreviewed",
    },
    latestCorrection: null,
    ...options,
  };
}

describe("buildOwnerActionInsights", () => {
  it("ranks a strength only after three independent, sufficiently confident reviews", () => {
    const result = buildOwnerActionInsights([
      review("r-1"),
      review("r-22"),
      review("r-333"),
    ]);

    expect(result.strengths[0]).toMatchObject({
      aspect: "taste",
      conclusion: "supported",
      reviewCount: 3,
    });
    expect(result.strengths[0]?.citations).toHaveLength(3);
    expect(result.strengths[0]?.citations[0]).toEqual(
      expect.objectContaining({ reviewId: expect.any(String), excerpt: "عالی" }),
    );
  });

  it("withholds a conclusion when evidence is sparse or confidence is low", () => {
    const result = buildOwnerActionInsights([
      review("r-1"),
      review("r-2", {
        analysis: {
          ...review("template").analysis,
          confidence: 0.3,
        },
      }),
    ]);

    expect(result.strengths).toEqual([]);
    expect(result.withheld).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ aspect: "taste", reason: "insufficient_evidence" }),
      ]),
    );
  });

  it("groups recurring negative feedback with cited examples", () => {
    const negative = (id: string): OwnerAnalyzedReview =>
      review(id, {
        body: "برای سفارش خیلی دیر معطل شدیم.",
        rating: 2,
        analysis: {
          ...review("template").analysis,
          sentiment: "negative",
          aspectScores: {
            wait_time: {
              mentions: 2,
              positive: 0,
              negative: 2.1,
              net: -1,
              confidence: 0.72,
            },
          },
          evidenceSpans: [
            {
              aspect: "wait_time",
              polarity: "negative",
              start: 12,
              end: 20,
              excerpt: "خیلی دیر",
              cue: "خیلی دیر",
            },
          ],
          issueCluster: "wait_time",
          confidence: 0.78,
        },
      });

    const result = buildOwnerActionInsights([
      negative("n-1"),
      negative("n-22"),
      negative("n-333"),
    ]);

    expect(result.issues[0]).toMatchObject({
      aspect: "wait_time",
      issueCluster: "wait_time",
      conclusion: "supported",
      reviewCount: 3,
    });
    expect(result.issues[0]?.citations[0]?.excerpt).toBe("خیلی دیر");
  });

  it("uses the latest owner correction without mutating the model output", () => {
    const corrected = ["c-1", "c-22", "c-333"].map((id) =>
      review(id, {
        latestCorrection: {
          sentiment: "negative",
          aspectIds: ["service"],
          issueCluster: "service_experience",
          correctedAt: "2026-09-03T12:00:00.000Z",
        },
      }),
    );

    const result = buildOwnerActionInsights(corrected);

    expect(result.issues[0]).toMatchObject({
      aspect: "service",
      issueCluster: "service_experience",
      source: "owner_corrected",
    });
    expect(corrected[0]?.analysis.aspectScores.taste?.positive).toBe(2);
  });

  it("treats a mixed owner correction with a named problem as issue evidence", () => {
    const corrected = ["m-1", "m-22", "m-333"].map((id) =>
      review(id, {
        latestCorrection: {
          sentiment: "mixed",
          aspectIds: ["value"],
          issueCluster: "price_value",
          correctedAt: "2026-09-03T12:00:00.000Z",
        },
      }),
    );

    expect(buildOwnerActionInsights(corrected).issues[0]).toMatchObject({
      aspect: "value",
      issueCluster: "price_value",
      source: "owner_corrected",
    });
  });

  it("does not expose private Taste Graph or user preference fields", () => {
    const result = buildOwnerActionInsights([
      review("r-1"),
      review("r-22"),
      review("r-333"),
    ]);

    expect(JSON.stringify(result)).not.toMatch(
      /tasteProfile|dimensionWeights|userId|anonymousSession/i,
    );
  });

  it("defines a reproducible before metric for an improvement action", () => {
    const reviews = [
      review("b-1", {
        createdAt: "2026-08-10T10:00:00.000Z",
        analysis: {
          ...review("template").analysis,
          sentiment: "negative",
          aspectScores: {
            wait_time: {
              mentions: 1,
              positive: 0,
              negative: 1.5,
              net: -1,
              confidence: 0.7,
            },
          },
          issueCluster: "wait_time",
        },
      }),
      review("b-2", { createdAt: "2026-08-20T10:00:00.000Z" }),
      review("old", { createdAt: "2025-01-01T10:00:00.000Z" }),
    ];

    expect(
      calculateNegativeBaseline(reviews, "wait_time", {
        start: "2026-06-06",
        end: "2026-09-03",
      }),
    ).toEqual({ reviewCount: 2, negativeMentions: 1, negativeRate: 0.5 });
  });

  it("uses owner-corrected mixed issues in the before metric", () => {
    const corrected = review("mixed", {
      createdAt: "2026-09-03T10:00:00.000Z",
      latestCorrection: {
        sentiment: "mixed",
        aspectIds: ["service"],
        issueCluster: "service_experience",
        correctedAt: "2026-09-03T12:00:00.000Z",
      },
    });

    expect(
      calculateNegativeBaseline([corrected], "service", {
        start: "2026-09-01",
        end: "2026-09-04",
      }),
    ).toEqual({ reviewCount: 1, negativeMentions: 1, negativeRate: 1 });
  });

  it("assigns reviews to the Tehran calendar day", () => {
    const afterTehranMidnight = review("boundary", {
      createdAt: "2026-09-03T21:00:00.000Z",
    });

    expect(
      calculateNegativeBaseline([afterTehranMidnight], "taste", {
        start: "2026-09-04",
        end: "2026-09-04",
      }),
    ).toEqual({ reviewCount: 1, negativeMentions: 0, negativeRate: 0 });
  });
});
