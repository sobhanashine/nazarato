import type {
  AspectId,
  AspectScore,
  EvidenceSpan,
  IssueCluster,
  Sentiment,
} from "@/lib/intelligence/customer-voice-baseline";
import { toTehranIsoDay } from "./owner-action-input";

export const ASPECT_LABELS: Readonly<Record<AspectId, string>> = {
  taste: "کیفیت و طعم",
  service: "رفتار و سرویس",
  value: "قیمت و ارزش خرید",
  atmosphere: "فضا و راحتی",
  cleanliness: "نظافت و بهداشت",
  wait_time: "زمان انتظار",
};

export const ISSUE_CLUSTER_LABELS: Readonly<Record<IssueCluster, string>> = {
  taste_quality: "کیفیت یا طعم",
  service_experience: "تجربه سرویس",
  price_value: "قیمت نسبت به ارزش",
  atmosphere_comfort: "فضا و آسایش",
  cleanliness_hygiene: "نظافت و بهداشت",
  wait_time: "زمان انتظار",
  general_dissatisfaction: "نارضایتی عمومی",
};

export type OwnerCorrection = {
  sentiment: Sentiment;
  aspectIds: AspectId[];
  issueCluster: IssueCluster | null;
  correctedAt: string;
};

export type OwnerAnalyzedReview = {
  id: string;
  body: string;
  createdAt: string;
  rating: number;
  analysis: {
    modelId: string;
    modelVersion: string;
    sentiment: Sentiment;
    aspectScores: Partial<Record<AspectId, AspectScore>>;
    evidenceSpans: EvidenceSpan[];
    issueCluster: IssueCluster | null;
    confidence: number;
    humanStatus: "unreviewed" | "confirmed" | "corrected" | "rejected";
  };
  latestCorrection: OwnerCorrection | null;
};

export type InsightCitation = {
  reviewId: string;
  excerpt: string;
  createdAt: string;
  rating: number;
};

export type SupportedInsight = {
  aspect: AspectId;
  issueCluster: IssueCluster | null;
  conclusion: "supported";
  reviewCount: number;
  confidence: number;
  source: "model" | "owner_corrected";
  citations: InsightCitation[];
};

export type WithheldInsight = {
  aspect: AspectId;
  direction: "strength" | "issue";
  reviewCount: number;
  confidence: number;
  reason: "insufficient_evidence" | "low_confidence";
};

export type OwnerActionInsights = {
  strengths: SupportedInsight[];
  issues: SupportedInsight[];
  withheld: WithheldInsight[];
  analyzedReviewCount: number;
  correctedReviewCount: number;
  threshold: { minimumReviews: number; minimumConfidence: number };
};

type Direction = "strength" | "issue";

type Observation = {
  aspect: AspectId;
  direction: Direction;
  issueCluster: IssueCluster | null;
  confidence: number;
  corrected: boolean;
  citation: InsightCitation;
};

const MINIMUM_REVIEWS = 3;
const MINIMUM_CONFIDENCE = 0.55;
const MAX_CITATIONS = 3;

const ISSUE_CLUSTER_BY_ASPECT: Readonly<Record<AspectId, IssueCluster>> = {
  taste: "taste_quality",
  service: "service_experience",
  value: "price_value",
  atmosphere: "atmosphere_comfort",
  cleanliness: "cleanliness_hygiene",
  wait_time: "wait_time",
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function excerptFor(
  review: OwnerAnalyzedReview,
  aspect: AspectId,
  direction: Direction,
): string {
  const polarity = direction === "strength" ? "positive" : "negative";
  const exact = review.analysis.evidenceSpans.find(
    (span) => span.aspect === aspect && span.polarity === polarity,
  );
  const related = review.analysis.evidenceSpans.find(
    (span) => span.polarity === polarity,
  );
  const excerpt = exact?.excerpt ?? related?.excerpt ?? review.body;
  return excerpt.length > 180 ? `${excerpt.slice(0, 177)}…` : excerpt;
}

function correctedObservations(review: OwnerAnalyzedReview): Observation[] {
  const correction = review.latestCorrection;
  if (!correction) return [];

  const direction =
    correction.sentiment === "positive"
      ? "strength"
      : correction.sentiment === "negative" ||
          (correction.sentiment === "mixed" && correction.issueCluster !== null)
        ? "issue"
        : null;
  if (!direction) return [];

  return correction.aspectIds.map((aspect) => ({
    aspect,
    direction,
    issueCluster: direction === "issue" ? correction.issueCluster : null,
    confidence: 1,
    corrected: true,
    citation: {
      reviewId: review.id,
      excerpt: excerptFor(review, aspect, direction),
      createdAt: review.createdAt,
      rating: review.rating,
    },
  }));
}

function modelObservations(review: OwnerAnalyzedReview): Observation[] {
  // A corrected row without its correction event is incomplete evidence (for
  // example when that table is temporarily unavailable), so fail closed.
  if (
    review.analysis.humanStatus === "rejected" ||
    review.analysis.humanStatus === "corrected"
  ) return [];

  return (Object.entries(review.analysis.aspectScores) as [AspectId, AspectScore][])
    .flatMap(([aspect, score]): Observation[] => {
      const direction =
        score.positive > score.negative
          ? "strength"
          : score.negative > score.positive
            ? "issue"
            : null;
      if (!direction) return [];

      return [
        {
          aspect,
          direction,
          issueCluster:
            direction === "issue" ? ISSUE_CLUSTER_BY_ASPECT[aspect] : null,
          confidence: Math.min(review.analysis.confidence, score.confidence),
          corrected: false,
          citation: {
            reviewId: review.id,
            excerpt: excerptFor(review, aspect, direction),
            createdAt: review.createdAt,
            rating: review.rating,
          },
        },
      ];
    });
}

function groupKey(observation: Observation): string {
  return `${observation.direction}:${observation.aspect}:${observation.issueCluster ?? "none"}`;
}

/**
 * Turns evidence-bearing, versioned review analyses into conservative owner
 * decisions. Sparse/weak patterns are returned only as withheld metadata so
 * the UI cannot accidentally present a guess as a business conclusion.
 */
export function buildOwnerActionInsights(
  reviews: readonly OwnerAnalyzedReview[],
): OwnerActionInsights {
  const observations = reviews.flatMap((review) =>
    review.latestCorrection
      ? correctedObservations(review)
      : modelObservations(review),
  );
  const groups = new Map<string, Observation[]>();

  for (const observation of observations) {
    const key = groupKey(observation);
    const group = groups.get(key) ?? [];
    if (!group.some((item) => item.citation.reviewId === observation.citation.reviewId)) {
      group.push(observation);
    }
    groups.set(key, group);
  }

  const strengths: SupportedInsight[] = [];
  const issues: SupportedInsight[] = [];
  const withheld: WithheldInsight[] = [];

  for (const group of groups.values()) {
    const [first] = group;
    if (!first) continue;

    const confidence = round(
      group.reduce((sum, item) => sum + item.confidence, 0) / group.length,
    );
    const reason =
      group.length < MINIMUM_REVIEWS
        ? "insufficient_evidence"
        : confidence < MINIMUM_CONFIDENCE
          ? "low_confidence"
          : null;

    if (reason) {
      withheld.push({
        aspect: first.aspect,
        direction: first.direction,
        reviewCount: group.length,
        confidence,
        reason,
      });
      continue;
    }

    const insight: SupportedInsight = {
      aspect: first.aspect,
      issueCluster: first.issueCluster,
      conclusion: "supported",
      reviewCount: group.length,
      confidence,
      source: group.some((item) => item.corrected) ? "owner_corrected" : "model",
      citations: group
        .slice()
        .sort((left, right) =>
          right.citation.createdAt.localeCompare(left.citation.createdAt),
        )
        .slice(0, MAX_CITATIONS)
        .map((item) => item.citation),
    };

    (first.direction === "strength" ? strengths : issues).push(insight);
  }

  const rank = (left: SupportedInsight, right: SupportedInsight) =>
    right.reviewCount - left.reviewCount || right.confidence - left.confidence;

  return {
    strengths: strengths.sort(rank),
    issues: issues.sort(rank),
    withheld: withheld.sort((left, right) => right.reviewCount - left.reviewCount),
    analyzedReviewCount: reviews.length,
    correctedReviewCount: reviews.filter((review) => review.latestCorrection).length,
    threshold: {
      minimumReviews: MINIMUM_REVIEWS,
      minimumConfidence: MINIMUM_CONFIDENCE,
    },
  };
}

export type NegativeBaseline = {
  reviewCount: number;
  negativeMentions: number;
  negativeRate: number;
};

/** Reproducible denominator + negative mention rate used for before/after. */
export function calculateNegativeBaseline(
  reviews: readonly OwnerAnalyzedReview[],
  aspect: AspectId,
  window: { start: string; end: string },
): NegativeBaseline {
  const inWindow = reviews.filter((review) => {
    const day = toTehranIsoDay(new Date(review.createdAt));
    return day >= window.start && day <= window.end;
  });
  const negativeMentions = inWindow.filter((review) => {
    if (review.latestCorrection) {
      return (
        (review.latestCorrection.sentiment === "negative" ||
          (review.latestCorrection.sentiment === "mixed" &&
            review.latestCorrection.issueCluster !== null)) &&
        review.latestCorrection.aspectIds.includes(aspect)
      );
    }
    if (review.analysis.humanStatus === "rejected") return false;
    const score = review.analysis.aspectScores[aspect];
    return Boolean(score && score.negative > score.positive);
  }).length;

  return {
    reviewCount: inWindow.length,
    negativeMentions,
    negativeRate:
      inWindow.length === 0 ? 0 : round(negativeMentions / inWindow.length),
  };
}
