export const NABZ_BUSINESS_POOL_POLICY = {
  requiredDuelBusinesses: 2,
  requiredRecommendationEvidence: 3,
} as const;

export type NabzBusinessKind = "کافه" | "رستوران";

export type NabzSourceFact =
  | "name"
  | "category"
  | "city"
  | "neighborhood"
  | "location"
  | "price"
  | "address";

export type NabzBusinessPoolCandidate = {
  id: string;
  slug: string;
  name: string;
  kind: NabzBusinessKind;
  neighborhoodSlug: string | null;
  priceBand: 1 | 2 | 3 | 4 | null;
  sourceFacts: readonly NabzSourceFact[];
  comparisonEvidenceCount: number;
  reviewEvidenceCount: number;
  firstPartyEvidenceCount: number;
  duelReady: boolean;
  recommendationReady: boolean;
};

export type NabzBusinessPoolSummary = {
  eligibleBusinessCount: number;
  duelReadyBusinessCount: number;
  recommendationReadyBusinessCount: number;
  requiredDuelBusinesses: number;
  requiredRecommendationEvidence: number;
};

export type NabzBusinessPoolSnapshot = {
  status: "ready" | "insufficient_supply";
  businesses: readonly NabzBusinessPoolCandidate[];
  summary: NabzBusinessPoolSummary;
  message: string;
};

export type NabzBusinessPoolLoadResult =
  | NabzBusinessPoolSnapshot
  | {
      status: "unavailable";
      summary: NabzBusinessPoolSummary;
      message: string;
    };

export interface NabzBusinessPoolRepository {
  listBusinesses(): Promise<unknown>;
  listAcceptedVotes(businessIds: readonly string[]): Promise<unknown>;
  listReviewEvidence(businessIds: readonly string[]): Promise<unknown>;
}

type BaseCandidate = Omit<
  NabzBusinessPoolCandidate,
  | "comparisonEvidenceCount"
  | "reviewEvidenceCount"
  | "firstPartyEvidenceCount"
  | "recommendationReady"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTrimmedString(value: unknown, maximum = 240): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maximum) return null;
  return trimmed;
}

function readCoordinate(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function readPriceBand(value: unknown): 1 | 2 | 3 | 4 | null {
  const parsed = readCoordinate(value);
  return parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4
    ? parsed
    : null;
}

function sameCoordinate(left: unknown, right: unknown): boolean {
  const leftNumber = readCoordinate(left);
  const rightNumber = readCoordinate(right);
  return (
    leftNumber !== null &&
    rightNumber !== null &&
    Math.abs(leftNumber - rightNumber) < 0.000001
  );
}

function readAddress(value: unknown): string | null {
  if (!isRecord(value)) return null;
  return readTrimmedString(value.address, 500);
}

function sourcePayloads(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((source) => {
    if (
      !isRecord(source) ||
      source.status !== "approved" ||
      !isRecord(source.field_payload)
    ) {
      return [];
    }
    return [source.field_payload];
  });
}

function parseBaseCandidate(value: unknown): BaseCandidate | null {
  if (!isRecord(value) || value.status !== "active" || value.city !== "رشت") {
    return null;
  }

  const id = readTrimmedString(value.id, 100);
  const slug = readTrimmedString(value.slug, 160);
  const name = readTrimmedString(value.name, 200);
  const categorySlug = value.category_slug;
  const kind: NabzBusinessKind | null =
    categorySlug === "cafe"
      ? "کافه"
      : categorySlug === "restaurant"
        ? "رستوران"
        : null;
  if (!id || !slug || !name || !kind) return null;

  const payloads = sourcePayloads(value.business_sources);
  const hasIdentitySource = payloads.some(
    (payload) =>
      readTrimmedString(payload.name, 200) === name &&
      payload.category_slug === categorySlug &&
      payload.city === "رشت",
  );
  if (!hasIdentitySource) return null;

  const facts = new Set<NabzSourceFact>(["name", "category", "city"]);
  const neighborhoodSlug = readTrimmedString(value.neighborhood_slug, 160);
  const priceBand = readPriceBand(value.price_band);
  const address = readAddress(value.contact);

  for (const payload of payloads) {
    if (
      neighborhoodSlug &&
      readTrimmedString(payload.neighborhood_slug, 160) === neighborhoodSlug
    ) {
      facts.add("neighborhood");
    }
    if (
      sameCoordinate(payload.latitude, value.latitude) &&
      sameCoordinate(payload.longitude, value.longitude)
    ) {
      facts.add("location");
    }
    if (priceBand && readPriceBand(payload.price_band) === priceBand) {
      facts.add("price");
    }
    if (address && readAddress(payload.contact) === address) {
      facts.add("address");
    }
  }

  const sourceFacts = [...facts];
  return {
    id,
    slug,
    name,
    kind,
    neighborhoodSlug,
    priceBand,
    sourceFacts,
    duelReady: sourceFacts.some((fact) =>
      ["neighborhood", "location", "price", "address"].includes(fact),
    ),
  };
}

function evidenceCounts(
  businessIds: ReadonlySet<string>,
  votes: unknown,
  reviewEvidence: unknown,
): {
  comparisons: Map<string, number>;
  reviews: Map<string, number>;
} {
  const comparisons = new Map<string, number>();
  if (Array.isArray(votes)) {
    for (const vote of votes) {
      if (!isRecord(vote)) continue;
      if (
        "moderation_status" in vote &&
        vote.moderation_status !== "accepted"
      ) {
        continue;
      }
      const weight = "weight" in vote ? readCoordinate(vote.weight) : 1;
      if (weight === null || weight <= 0 || weight > 1) continue;

      const winnerId = readTrimmedString(vote.winner_business_id, 100);
      const loserId = readTrimmedString(vote.loser_business_id, 100);
      if (
        !winnerId ||
        !loserId ||
        winnerId === loserId ||
        !businessIds.has(winnerId) ||
        !businessIds.has(loserId)
      ) {
        continue;
      }
      comparisons.set(winnerId, (comparisons.get(winnerId) ?? 0) + 1);
      comparisons.set(loserId, (comparisons.get(loserId) ?? 0) + 1);
    }
  }

  const reviews = new Map<string, number>();
  if (Array.isArray(reviewEvidence)) {
    for (const review of reviewEvidence) {
      if (!isRecord(review)) continue;
      const businessId = readTrimmedString(review.business_id, 100);
      if (!businessId || !businessIds.has(businessId)) continue;
      if (!Array.isArray(review.review_analyses)) continue;

      const usable = review.review_analyses.some((analysis) => {
        if (!isRecord(analysis)) return false;
        const confidence = readCoordinate(analysis.confidence);
        return (
          analysis.is_active === true &&
          analysis.human_status !== "rejected" &&
          confidence !== null &&
          confidence >= 0.55 &&
          confidence <= 1
        );
      });
      if (usable) {
        reviews.set(businessId, (reviews.get(businessId) ?? 0) + 1);
      }
    }
  }

  return { comparisons, reviews };
}

function emptySummary(): NabzBusinessPoolSummary {
  return {
    eligibleBusinessCount: 0,
    duelReadyBusinessCount: 0,
    recommendationReadyBusinessCount: 0,
    requiredDuelBusinesses: NABZ_BUSINESS_POOL_POLICY.requiredDuelBusinesses,
    requiredRecommendationEvidence:
      NABZ_BUSINESS_POOL_POLICY.requiredRecommendationEvidence,
  };
}

/**
 * Build a fail-closed Rasht pool from source-backed facts and first-party signals.
 * Third-party descriptions, ratings, images, and reviews are never accepted here.
 */
export function evaluateNabzBusinessPool(input: {
  businesses: unknown;
  votes: unknown;
  reviewEvidence: unknown;
}): NabzBusinessPoolSnapshot {
  const baseBusinesses = Array.isArray(input.businesses)
    ? input.businesses.flatMap((row) => {
        const candidate = parseBaseCandidate(row);
        return candidate ? [candidate] : [];
      })
    : [];
  const ids = new Set(baseBusinesses.map((business) => business.id));
  const counts = evidenceCounts(ids, input.votes, input.reviewEvidence);

  const businesses: NabzBusinessPoolCandidate[] = baseBusinesses.map(
    (business) => {
      const comparisonEvidenceCount = counts.comparisons.get(business.id) ?? 0;
      const reviewEvidenceCount = counts.reviews.get(business.id) ?? 0;
      const firstPartyEvidenceCount =
        comparisonEvidenceCount + reviewEvidenceCount;
      return {
        ...business,
        comparisonEvidenceCount,
        reviewEvidenceCount,
        firstPartyEvidenceCount,
        recommendationReady:
          business.duelReady &&
          firstPartyEvidenceCount >=
            NABZ_BUSINESS_POOL_POLICY.requiredRecommendationEvidence,
      };
    },
  );

  const summary: NabzBusinessPoolSummary = {
    ...emptySummary(),
    eligibleBusinessCount: businesses.length,
    duelReadyBusinessCount: businesses.filter((business) => business.duelReady)
      .length,
    recommendationReadyBusinessCount: businesses.filter(
      (business) => business.recommendationReady,
    ).length,
  };
  const ready =
    summary.duelReadyBusinessCount >= summary.requiredDuelBusinesses;

  return {
    status: ready ? "ready" : "insufficient_supply",
    businesses,
    summary,
    message: ready
      ? "منبع کسب‌وکارهای واقعی برای ساخت دوئل آماده است."
      : "داده کافی نداریم؛ نسخه نمایشی تا تأیید حداقل دو کسب‌وکار واقعی جدا می‌ماند.",
  };
}

export async function loadNabzBusinessPool(
  repository: NabzBusinessPoolRepository,
): Promise<NabzBusinessPoolLoadResult> {
  try {
    const businesses = await repository.listBusinesses();
    const initial = evaluateNabzBusinessPool({
      businesses,
      votes: [],
      reviewEvidence: [],
    });
    const businessIds = initial.businesses.map((business) => business.id);
    if (businessIds.length === 0) return initial;

    const [votes, reviewEvidence] = await Promise.all([
      repository.listAcceptedVotes(businessIds),
      repository.listReviewEvidence(businessIds),
    ]);
    return evaluateNabzBusinessPool({ businesses, votes, reviewEvidence });
  } catch (error) {
    console.error("[nabz-business-pool] read failed", {
      route: "/",
      error: error instanceof Error ? error.message : "unknown error",
    });
    return {
      status: "unavailable",
      summary: emptySummary(),
      message: "وضعیت داده‌های واقعی فعلاً قابل بررسی نیست.",
    };
  }
}
