import {
  createEmptyNabzSession,
  recordDuelChoice,
  type NabzSession,
} from "./nabz-engine";
import {
  NABZ_DEMO_PLACES,
  NABZ_SCENARIOS,
  type NabzPlaceId,
  type NabzScenarioId,
} from "./nabz-demo-data";

export const ANONYMOUS_TASTE_STORAGE_KEY = "nazarato:nabz-taste:v1";
export const ANONYMOUS_TASTE_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

type AnonymousTasteSnapshot = {
  version: 1;
  savedAt: number;
  scenarioId: NabzScenarioId;
  selectedPlaceIds: NabzPlaceId[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function serializeAnonymousTasteSession(
  session: NabzSession,
  now = Date.now(),
): string {
  const snapshot: AnonymousTasteSnapshot = {
    version: 1,
    savedAt: now,
    scenarioId: session.scenarioId,
    selectedPlaceIds: session.choices.map((choice) => choice.selectedPlaceId),
  };

  return JSON.stringify(snapshot);
}

/**
 * Local storage is untrusted. Rebuild scores from known scenario/duel fixtures
 * rather than accepting stored weights, and intentionally discard free text.
 */
export function restoreAnonymousTasteSession(
  serialized: string,
  now = Date.now(),
): NabzSession | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return null;
  }

  if (
    !isRecord(parsed) ||
    parsed.version !== 1 ||
    typeof parsed.savedAt !== "number" ||
    !Number.isFinite(parsed.savedAt) ||
    parsed.savedAt > now + 5 * 60 * 1_000 ||
    now - parsed.savedAt > ANONYMOUS_TASTE_TTL_MS ||
    typeof parsed.scenarioId !== "string" ||
    !Array.isArray(parsed.selectedPlaceIds)
  ) {
    return null;
  }

  const scenario = NABZ_SCENARIOS.find(
    (candidate) => candidate.id === parsed.scenarioId,
  );
  if (!scenario || parsed.selectedPlaceIds.length > scenario.duels.length) {
    return null;
  }

  let session = createEmptyNabzSession(scenario.id);
  for (const [index, candidateId] of parsed.selectedPlaceIds.entries()) {
    const duel = scenario.duels[index];
    const placeExists = NABZ_DEMO_PLACES.some((place) => place.id === candidateId);
    if (
      typeof candidateId !== "string" ||
      !placeExists ||
      !duel ||
      !duel.options.includes(candidateId as NabzPlaceId)
    ) {
      return null;
    }

    const result = recordDuelChoice(
      session,
      duel,
      candidateId as NabzPlaceId,
    );
    if (!result.ok) {
      return null;
    }
    session = result.session;
  }

  return session;
}
