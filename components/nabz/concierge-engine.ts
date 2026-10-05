import {
  TASTE_DIMENSION_LABELS,
  TASTE_DIMENSIONS,
  type NabzPlace,
  type NabzScenarioId,
  type TasteDimension,
} from "./nabz-demo-data";
import type { NabzSession } from "./nabz-engine";

export type ConciergeBudget = "any" | NabzPlace["price"];
export type ConciergeGroup = "solo" | "pair" | "small" | "large";

export type ConciergeInput = {
  occasion: NabzScenarioId;
  budget: ConciergeBudget;
  group: ConciergeGroup;
  neighborhood: "any" | string;
  priorities: TasteDimension[];
};

export type ConciergeReason = {
  kind:
    | "taste"
    | "occasion"
    | "budget"
    | "group"
    | "neighborhood"
    | "priority";
  label: string;
  evidenceHref?: string;
};

export type ConciergeRecommendation = {
  place: NabzPlace;
  score: number;
  reasons: readonly ConciergeReason[];
};

export type ConciergeRanking =
  | {
      status: "ready";
      recommendations: readonly ConciergeRecommendation[];
      evidenceCount: number;
    }
  | {
      status: "insufficient_evidence";
      currentEvidence: number;
      requiredEvidence: number;
      message: string;
    };

export type ParseConciergeInputResult =
  | { ok: true; value: ConciergeInput }
  | { ok: false; error: string };

const BUDGETS: readonly ConciergeBudget[] = ["any", "اقتصادی", "متوسط", "ویژه"];
const GROUPS: readonly ConciergeGroup[] = ["solo", "pair", "small", "large"];
const MINIMUM_EVIDENCE = 3;

const OCCASION_WEIGHTS: Record<NabzScenarioId, Partial<Record<TasteDimension, number>>> = {
  date: { cozy: 3, quiet: 2, service: 1 },
  laptop: { quiet: 3, service: 2, value: 1 },
  budget: { value: 4, service: 1 },
  "local-food": { local: 4, cozy: 1 },
};

const GROUP_WEIGHTS: Record<ConciergeGroup, Partial<Record<TasteDimension, number>>> = {
  solo: { quiet: 3, cozy: 1 },
  pair: { cozy: 3, quiet: 2 },
  small: { social: 2, service: 2, cozy: 1 },
  large: { social: 4, service: 2 },
};

const GROUP_REASON_LABELS: Record<ConciergeGroup, string> = {
  solo: "برای یک نفر آرام‌تر است",
  pair: "برای دو نفر فضای مناسب‌تری دارد",
  small: "برای جمع کوچک متعادل است",
  large: "برای جمع بزرگ انرژی و سرویس بیشتری دارد",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTasteDimension(value: unknown): value is TasteDimension {
  return (
    typeof value === "string" &&
    TASTE_DIMENSIONS.includes(value as TasteDimension)
  );
}

function isScenario(value: unknown): value is NabzScenarioId {
  return ["date", "laptop", "budget", "local-food"].includes(String(value));
}

export function parseConciergeInput(input: unknown): ParseConciergeInputResult {
  if (!isRecord(input)) {
    return { ok: false, error: "اطلاعات کجابریم معتبر نیست." };
  }

  const allowedKeys = new Set([
    "occasion",
    "budget",
    "group",
    "neighborhood",
    "priorities",
  ]);
  if (Object.keys(input).some((key) => !allowedKeys.has(key))) {
    return { ok: false, error: "اطلاعات کجابریم معتبر نیست." };
  }

  if (
    !isScenario(input.occasion) ||
    !BUDGETS.includes(input.budget as ConciergeBudget) ||
    !GROUPS.includes(input.group as ConciergeGroup) ||
    typeof input.neighborhood !== "string" ||
    input.neighborhood.trim().length === 0 ||
    input.neighborhood.length > 80 ||
    !Array.isArray(input.priorities) ||
    input.priorities.length > 3 ||
    !input.priorities.every(isTasteDimension) ||
    new Set(input.priorities).size !== input.priorities.length
  ) {
    return { ok: false, error: "اطلاعات کجابریم معتبر نیست." };
  }

  return {
    ok: true,
    value: {
      occasion: input.occasion,
      budget: input.budget as ConciergeBudget,
      group: input.group as ConciergeGroup,
      neighborhood: input.neighborhood.trim(),
      priorities: [...input.priorities],
    },
  };
}

function dimensionScore(
  place: NabzPlace,
  weights: Partial<Record<TasteDimension, number>>,
): number {
  return TASTE_DIMENSIONS.reduce(
    (total, dimension) =>
      total + place.signals[dimension] * (weights[dimension] ?? 0),
    0,
  );
}

function budgetAdjustment(
  placeBudget: NabzPlace["price"],
  requestedBudget: ConciergeBudget,
): number {
  if (requestedBudget === "any") {
    return 0;
  }
  if (placeBudget === requestedBudget) {
    return 12;
  }

  const order: readonly NabzPlace["price"][] = ["اقتصادی", "متوسط", "ویژه"];
  const distance = Math.abs(order.indexOf(placeBudget) - order.indexOf(requestedBudget));
  return distance === 1 ? -3 : -8;
}

function buildReasons(
  place: NabzPlace,
  session: NabzSession,
  input: ConciergeInput,
): ConciergeReason[] {
  const reasons: ConciergeReason[] = [];
  const tasteMatches = TASTE_DIMENSIONS.filter(
    (dimension) => session.scores[dimension] > 0 && place.signals[dimension] >= 2,
  ).sort(
    (left, right) =>
      session.scores[right] * place.signals[right] -
      session.scores[left] * place.signals[left],
  );

  const leadingTaste = tasteMatches[0];
  if (leadingTaste) {
    reasons.push({
      kind: "taste",
      label: `با سلیقه «${TASTE_DIMENSION_LABELS[leadingTaste]}» تو جور است`,
      evidenceHref: `#taste-evidence-${leadingTaste}`,
    });
  }

  if (input.neighborhood !== "any" && place.neighborhood === input.neighborhood) {
    reasons.push({
      kind: "neighborhood",
      label: `در محله ${place.neighborhood}`,
    });
  }

  if (input.budget !== "any" && place.price === input.budget) {
    reasons.push({ kind: "budget", label: `در بودجه ${input.budget}` });
  }

  const leadingPriority = input.priorities
    .filter((dimension) => place.signals[dimension] >= 2)
    .sort(
      (left, right) => place.signals[right] - place.signals[left],
    )[0];
  if (leadingPriority && leadingPriority !== leadingTaste) {
    reasons.push({
      kind: "priority",
      label: `اولویت «${TASTE_DIMENSION_LABELS[leadingPriority]}» را پوشش می‌دهد`,
      evidenceHref: `#taste-evidence-${leadingPriority}`,
    });
  }

  if (reasons.length < 2) {
    reasons.push({ kind: "group", label: GROUP_REASON_LABELS[input.group] });
  }

  if (reasons.length < 2) {
    reasons.push({ kind: "occasion", label: "با موقعیت انتخابی تو هم‌خوان است" });
  }

  return reasons.slice(0, 3);
}

export function rankConciergePlaces(
  session: NabzSession,
  input: ConciergeInput,
  places: readonly NabzPlace[],
  limit: number,
): ConciergeRanking {
  if (
    session.choices.length < MINIMUM_EVIDENCE ||
    Object.values(session.scores).every((score) => score === 0)
  ) {
    return {
      status: "insufficient_evidence",
      currentEvidence: session.choices.length,
      requiredEvidence: MINIMUM_EVIDENCE,
      message: "داده کافی نداریم؛ حداقل ۳ انتخاب لازم است.",
    };
  }

  const boundedLimit = Math.max(0, Math.min(5, Math.floor(limit)));
  const recommendations = places
    .map((place) => {
      const tasteScore = TASTE_DIMENSIONS.reduce(
        (total, dimension) =>
          total + session.scores[dimension] * place.signals[dimension],
        0,
      );
      const priorityScore = input.priorities.reduce(
        (total, dimension) => total + place.signals[dimension] * 4,
        0,
      );
      const neighborhoodScore =
        input.neighborhood !== "any" && place.neighborhood === input.neighborhood
          ? 14
          : 0;
      const score =
        tasteScore +
        dimensionScore(place, OCCASION_WEIGHTS[input.occasion]) +
        dimensionScore(place, GROUP_WEIGHTS[input.group]) +
        priorityScore +
        neighborhoodScore +
        budgetAdjustment(place.price, input.budget);

      return {
        place,
        score,
        reasons: buildReasons(place, session, input),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.place.name.localeCompare(right.place.name, "fa"),
    )
    .slice(0, boundedLimit);

  return {
    status: "ready",
    recommendations,
    evidenceCount: session.choices.length,
  };
}
