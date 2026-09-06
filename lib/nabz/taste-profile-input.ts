import {
  NABZ_DEMO_PLACES,
  NABZ_SCENARIOS,
  TASTE_DIMENSIONS,
  type NabzPlaceId,
  type NabzScenarioId,
} from "../../components/nabz/nabz-demo-data";
import {
  createEmptyNabzSession,
  recordDuelChoice,
  type NabzSession,
  type TasteScores,
} from "../../components/nabz/nabz-engine";

/** Versioned identity for the Taste Graph weights stored in Supabase. */
export const TASTE_PROFILE_MODEL = {
  id: "nazarato-taste-graph",
  version: "0.1.0",
} as const;

export type TasteProfileInput = {
  scenarioId: NabzScenarioId;
  selectedPlaceIds: NabzPlaceId[];
};

export type ParseTasteProfileInputResult =
  | { ok: true; value: TasteProfileInput }
  | { ok: false; error: string };

export type TasteProfileView = {
  modelId: typeof TASTE_PROFILE_MODEL.id;
  modelVersion: typeof TASTE_PROFILE_MODEL.version;
  scores: TasteScores;
  evidenceCount: number;
  updatedAt: string;
};

export type ParseStoredTasteProfileResult =
  | { ok: true; value: TasteProfileView }
  | { ok: false; error: string };

/** Prevent a late initial read from replacing a newer server-confirmed save. */
export function chooseFreshTasteProfile(
  current: TasteProfileView | null,
  incoming: TasteProfileView | null,
): TasteProfileView | null {
  if (!current) {
    return incoming;
  }
  if (!incoming) {
    return current;
  }
  return Date.parse(incoming.updatedAt) >= Date.parse(current.updatedAt)
    ? incoming
    : current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isScenario(value: unknown): value is NabzScenarioId {
  return NABZ_SCENARIOS.some((scenario) => scenario.id === value);
}

function isDemoPlaceId(value: unknown): value is NabzPlaceId {
  return (
    typeof value === "string" &&
    NABZ_DEMO_PLACES.some((place) => place.id === value)
  );
}

/**
 * Validate the private database row before exposing its aggregate to a client.
 * Unknown future dimensions are ignored, while all dimensions in this model
 * remain required. Raw choices and free-text evidence are never returned.
 */
export function parseStoredTasteProfile(
  value: unknown,
): ParseStoredTasteProfileResult {
  if (
    !isRecord(value) ||
    value.model_id !== TASTE_PROFILE_MODEL.id ||
    value.model_version !== TASTE_PROFILE_MODEL.version ||
    !isRecord(value.dimension_weights) ||
    !Number.isInteger(value.evidence_count) ||
    (value.evidence_count as number) < 1 ||
    (value.evidence_count as number) > 5 ||
    typeof value.updated_at !== "string"
  ) {
    return { ok: false, error: "پروفایل ذخیره‌شده معتبر نیست." };
  }

  const updatedAtTimestamp = Date.parse(value.updated_at);
  if (!Number.isFinite(updatedAtTimestamp)) {
    return { ok: false, error: "پروفایل ذخیره‌شده معتبر نیست." };
  }

  const scores = {} as TasteScores;
  for (const dimension of TASTE_DIMENSIONS) {
    const score = value.dimension_weights[dimension];
    if (
      typeof score !== "number" ||
      !Number.isInteger(score) ||
      score < 0 ||
      score > 100
    ) {
      return { ok: false, error: "پروفایل ذخیره‌شده معتبر نیست." };
    }
    scores[dimension] = score;
  }

  return {
    ok: true,
    value: {
      modelId: TASTE_PROFILE_MODEL.id,
      modelVersion: TASTE_PROFILE_MODEL.version,
      scores,
      evidenceCount: value.evidence_count as number,
      updatedAt: new Date(updatedAtTimestamp).toISOString(),
    },
  };
}

/**
 * Parse the client payload before it reaches the server-side profile writer.
 * The selected IDs are intentionally rebuilt against the trusted fixture set;
 * the client never gets to submit arbitrary scores or evidence counts.
 */
export function parseTasteProfileInput(
  value: unknown,
): ParseTasteProfileInputResult {
  if (!isRecord(value)) {
    return { ok: false, error: "اطلاعات سلیقه معتبر نیست." };
  }

  const keys = Object.keys(value);
  if (
    keys.length !== 2 ||
    !keys.includes("scenarioId") ||
    !keys.includes("selectedPlaceIds")
  ) {
    return { ok: false, error: "اطلاعات سلیقه معتبر نیست." };
  }

  if (
    !isScenario(value.scenarioId) ||
    !Array.isArray(value.selectedPlaceIds) ||
    value.selectedPlaceIds.length < 1 ||
    value.selectedPlaceIds.length > 5 ||
    !value.selectedPlaceIds.every(isDemoPlaceId)
  ) {
    return { ok: false, error: "اطلاعات سلیقه معتبر نیست." };
  }

  const scenario = NABZ_SCENARIOS.find(
    (candidate) => candidate.id === value.scenarioId,
  );
  if (!scenario || value.selectedPlaceIds.length > scenario.duels.length) {
    return { ok: false, error: "اطلاعات سلیقه معتبر نیست." };
  }

  const parsed: TasteProfileInput = {
    scenarioId: value.scenarioId,
    selectedPlaceIds: [...value.selectedPlaceIds],
  };
  return rebuildTasteProfileSession(parsed)
    ? { ok: true, value: parsed }
    : { ok: false, error: "انتخاب‌های سلیقه با دوئل‌های این موقعیت هم‌خوان نیست." };
}

/** Rebuild trusted scores from IDs; no client-provided weights are accepted. */
export function rebuildTasteProfileSession(
  input: TasteProfileInput,
): NabzSession | null {
  const scenario = NABZ_SCENARIOS.find(
    (candidate) => candidate.id === input.scenarioId,
  );
  if (
    !scenario ||
    input.selectedPlaceIds.length < 1 ||
    input.selectedPlaceIds.length > scenario.duels.length
  ) {
    return null;
  }

  let session = createEmptyNabzSession(input.scenarioId);
  for (const [index, selectedPlaceId] of input.selectedPlaceIds.entries()) {
    const duel = scenario.duels[index];
    if (!duel || !isDemoPlaceId(selectedPlaceId)) {
      return null;
    }

    const result = recordDuelChoice(session, duel, selectedPlaceId);
    if (!result.ok) {
      return null;
    }
    session = result.session;
  }

  return session;
}
