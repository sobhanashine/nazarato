import type { ComparisonScenario } from "./vote-contract";

export type NabzFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type LiveNabzBusiness = {
  id: string;
  slug: string;
  name: string;
  kind: "کافه" | "رستوران";
  neighborhoodSlug: string | null;
  priceBand: 1 | 2 | 3 | 4 | null;
};

export type LiveNabzDuel = {
  scenario: ComparisonScenario;
  round: number;
  availablePairCount: number;
  prompt: string;
  options: readonly [LiveNabzBusiness, LiveNabzBusiness];
};

export type LoadLiveNabzDuelResult =
  | { ok: true; duel: LiveNabzDuel }
  | { ok: false; reason: "insufficient_supply" | "unavailable" };

export type SubmitLiveNabzVoteResult =
  | { ok: true; stored: boolean; duplicate: boolean }
  | { ok: false };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUPPORTED_SCENARIOS = new Set<ComparisonScenario>([
  "date",
  "laptop",
  "budget",
  "local-food",
]);
const REQUIRED_LIVE_PAIRS = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maximum ? trimmed : null;
}

function readBusiness(value: unknown): LiveNabzBusiness | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id, 100);
  const slug = readString(value.slug, 160);
  const name = readString(value.name, 200);
  const kind = value.kind;
  const neighborhoodSlug =
    value.neighborhoodSlug === null
      ? null
      : readString(value.neighborhoodSlug, 160);
  const priceBand = value.priceBand;

  if (
    !id ||
    !UUID_PATTERN.test(id) ||
    !slug ||
    !name ||
    (kind !== "کافه" && kind !== "رستوران") ||
    (value.neighborhoodSlug !== null && !neighborhoodSlug) ||
    !(
      priceBand === null ||
      priceBand === 1 ||
      priceBand === 2 ||
      priceBand === 3 ||
      priceBand === 4
    )
  ) {
    return null;
  }

  return { id, slug, name, kind, neighborhoodSlug, priceBand };
}

function readReadyDuel(
  value: unknown,
  scenario: ComparisonScenario,
  round: number,
): LiveNabzDuel | null {
  if (
    !isRecord(value) ||
    value.ok !== true ||
    value.status !== "ready" ||
    value.scenario !== scenario ||
    value.round !== round ||
    !Number.isSafeInteger(value.availablePairCount) ||
    typeof value.availablePairCount !== "number" ||
    value.availablePairCount < REQUIRED_LIVE_PAIRS ||
    !isRecord(value.pair) ||
    !Array.isArray(value.pair.options) ||
    value.pair.options.length !== 2
  ) {
    return null;
  }

  const prompt = readString(value.pair.prompt, 240);
  const first = readBusiness(value.pair.options[0]);
  const second = readBusiness(value.pair.options[1]);
  if (!prompt || !first || !second || first.id === second.id) return null;

  return {
    scenario,
    round,
    availablePairCount: value.availablePairCount,
    prompt,
    options: [first, second],
  };
}

export async function loadLiveNabzDuel(
  scenario: ComparisonScenario,
  round: number,
  fetcher: NabzFetch = fetch,
): Promise<LoadLiveNabzDuelResult> {
  if (
    !SUPPORTED_SCENARIOS.has(scenario) ||
    !Number.isSafeInteger(round) ||
    round < 0 ||
    round >= REQUIRED_LIVE_PAIRS
  ) {
    return { ok: false, reason: "unavailable" };
  }

  try {
    const query = new URLSearchParams({ scenario, round: String(round) });
    const response = await fetcher(`/api/nabz/duel?${query.toString()}`, {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return { ok: false, reason: "unavailable" };

    const body = (await response.json()) as unknown;
    const duel = readReadyDuel(body, scenario, round);
    if (duel) return { ok: true, duel };

    if (
      isRecord(body) &&
      body.ok === true &&
      body.status === "insufficient_supply" &&
      body.scenario === scenario &&
      body.round === round
    ) {
      return { ok: false, reason: "insufficient_supply" };
    }

    return { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function submitLiveNabzVote(
  input: {
    scenario: ComparisonScenario;
    winnerBusinessId: string;
    loserBusinessId: string;
    reasonText?: string;
  },
  fetcher: NabzFetch = fetch,
): Promise<SubmitLiveNabzVoteResult> {
  const reasonText = input.reasonText?.trim();
  if (
    !SUPPORTED_SCENARIOS.has(input.scenario) ||
    !UUID_PATTERN.test(input.winnerBusinessId) ||
    !UUID_PATTERN.test(input.loserBusinessId) ||
    input.winnerBusinessId === input.loserBusinessId ||
    (reasonText !== undefined && (reasonText.length === 0 || reasonText.length > 120))
  ) {
    return { ok: false };
  }

  try {
    const response = await fetcher("/api/nabz/votes", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        citySlug: "rasht",
        scenarioSlug: input.scenario,
        winnerBusinessId: input.winnerBusinessId,
        loserBusinessId: input.loserBusinessId,
        ...(reasonText ? { reasonText } : {}),
      }),
    });
    if (!response.ok) return { ok: false };

    const body = (await response.json()) as unknown;
    if (
      !isRecord(body) ||
      body.ok !== true ||
      typeof body.stored !== "boolean" ||
      typeof body.duplicate !== "boolean" ||
      body.stored === body.duplicate
    ) {
      return { ok: false };
    }
    return {
      ok: true,
      stored: body.stored,
      duplicate: body.duplicate,
    };
  } catch {
    return { ok: false };
  }
}
