import type {
  NabzBusinessKind,
  NabzBusinessPoolCandidate,
} from "./business-pool";
import {
  COMPARISON_SCENARIOS,
  type ComparisonScenario,
} from "./vote-contract";

export const NABZ_DUEL_ROUNDS = 5;

export type NabzDuelQuery = {
  scenario: ComparisonScenario;
  round: number;
};

export type NabzDuelQueryIssue = {
  path: string;
  message: string;
};

export type NabzDuelPublicBusiness = {
  id: string;
  slug: string;
  name: string;
  kind: NabzBusinessKind;
  neighborhoodSlug: string | null;
  priceBand: 1 | 2 | 3 | 4 | null;
};

export type NabzDuelResult =
  | {
      status: "ready";
      scenario: ComparisonScenario;
      round: number;
      availablePairCount: number;
      pair: {
        prompt: string;
        options: readonly [NabzDuelPublicBusiness, NabzDuelPublicBusiness];
      };
    }
  | {
      status: "insufficient_supply";
      scenario: ComparisonScenario;
      round: number;
      availablePairCount: number;
      message: string;
    };

const ALLOWED_QUERY_KEYS = new Set(["scenario", "round"]);

const SCENARIO_PROMPTS: Record<ComparisonScenario, string> = {
  date: "برای یک قرار دونفره کدام را انتخاب می‌کنی؟",
  laptop: "برای دو ساعت کار با لپ‌تاپ کدام را انتخاب می‌کنی؟",
  budget: "برای یک انتخاب اقتصادی کدام را برمی‌داری؟",
  "local-food": "برای یک تجربه غذای محلی کدام را انتخاب می‌کنی؟",
};

function isScenario(value: string | null): value is ComparisonScenario {
  return COMPARISON_SCENARIOS.some((scenario) => scenario === value);
}

export function parseNabzDuelQuery(
  searchParams: URLSearchParams,
):
  | { ok: true; value: NabzDuelQuery }
  | { ok: false; issues: readonly NabzDuelQueryIssue[] } {
  const issues: NabzDuelQueryIssue[] = [];
  const keys = [...new Set(searchParams.keys())];

  for (const key of keys) {
    if (!ALLOWED_QUERY_KEYS.has(key)) {
      issues.push({ path: key, message: "پارامتر پشتیبانی نمی‌شود." });
    }
  }

  for (const key of ALLOWED_QUERY_KEYS) {
    if (searchParams.getAll(key).length !== 1) {
      issues.push({ path: key, message: "پارامتر باید دقیقاً یک‌بار ارسال شود." });
    }
  }

  const scenario = searchParams.get("scenario");
  if (!isScenario(scenario)) {
    issues.push({ path: "scenario", message: "موقعیت انتخاب‌شده معتبر نیست." });
  }

  const rawRound = searchParams.get("round");
  const round = rawRound && /^\d+$/.test(rawRound) ? Number(rawRound) : -1;
  if (!Number.isSafeInteger(round) || round < 0 || round >= NABZ_DUEL_ROUNDS) {
    issues.push({ path: "round", message: "شماره انتخاب باید بین ۰ تا ۴ باشد." });
  }

  if (issues.length > 0 || !isScenario(scenario)) {
    return { ok: false, issues };
  }

  return { ok: true, value: { scenario, round } };
}

function readPublicBusiness(
  candidate: NabzBusinessPoolCandidate,
): NabzDuelPublicBusiness | null {
  if (
    !candidate.duelReady ||
    typeof candidate.id !== "string" ||
    candidate.id.length === 0 ||
    typeof candidate.slug !== "string" ||
    candidate.slug.length === 0 ||
    typeof candidate.name !== "string" ||
    candidate.name.length === 0 ||
    (candidate.kind !== "کافه" && candidate.kind !== "رستوران") ||
    !(
      candidate.neighborhoodSlug === null ||
      typeof candidate.neighborhoodSlug === "string"
    ) ||
    !(
      candidate.priceBand === null ||
      [1, 2, 3, 4].includes(candidate.priceBand)
    )
  ) {
    return null;
  }

  return {
    id: candidate.id,
    slug: candidate.slug,
    name: candidate.name,
    kind: candidate.kind,
    neighborhoodSlug: candidate.neighborhoodSlug,
    priceBand: candidate.priceBand,
  };
}

function seedFor(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function utcDateKey(now: Date): string {
  return Number.isFinite(now.getTime())
    ? now.toISOString().slice(0, 10)
    : "1970-01-01";
}

export function buildNabzDuel(input: {
  businesses: readonly NabzBusinessPoolCandidate[];
  scenario: ComparisonScenario;
  round: number;
  now?: Date;
}): NabzDuelResult {
  const seen = new Set<string>();
  const businesses = input.businesses
    .flatMap((candidate) => {
      const business = readPublicBusiness(candidate);
      if (!business || seen.has(business.id)) return [];
      seen.add(business.id);
      return [business];
    })
    .sort((left, right) => left.id.localeCompare(right.id, "en"));

  const pairs: Array<readonly [NabzDuelPublicBusiness, NabzDuelPublicBusiness]> = [];
  for (let left = 0; left < businesses.length; left += 1) {
    for (let right = left + 1; right < businesses.length; right += 1) {
      pairs.push([businesses[left], businesses[right]]);
    }
  }

  const availablePairCount = pairs.length;
  if (input.round < 0 || input.round >= NABZ_DUEL_ROUNDS || input.round >= pairs.length) {
    return {
      status: "insufficient_supply",
      scenario: input.scenario,
      round: input.round,
      availablePairCount,
      message:
        "داده کافی نداریم؛ برای این مرحله هنوز زوج واقعی و تکرارنشده‌ای آماده نیست.",
    };
  }

  const seed = seedFor(`${utcDateKey(input.now ?? new Date())}:${input.scenario}`);
  const pair = pairs[(seed + input.round) % pairs.length];
  const options: readonly [NabzDuelPublicBusiness, NabzDuelPublicBusiness] =
    (seed + input.round) % 2 === 0 ? pair : [pair[1], pair[0]];

  return {
    status: "ready",
    scenario: input.scenario,
    round: input.round,
    availablePairCount,
    pair: {
      prompt: SCENARIO_PROMPTS[input.scenario],
      options,
    },
  };
}
