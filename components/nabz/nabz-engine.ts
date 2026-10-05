import {
  NABZ_DEMO_PLACES,
  TASTE_DIMENSION_LABELS,
  TASTE_DIMENSIONS,
  type NabzDuel,
  type NabzPlace,
  type NabzPlaceId,
  type NabzScenario,
  type NabzScenarioId,
  type TasteDimension,
} from "./nabz-demo-data";

export type TasteScores = Record<TasteDimension, number>;

export interface NabzChoice {
  duelId: string;
  selectedPlaceId: NabzPlaceId;
  reason?: string;
  strongestSignal: TasteDimension;
}
export interface NabzSession {
  scenarioId: NabzScenarioId;
  choices: readonly NabzChoice[];
  scores: TasteScores;
}

export type RecordChoiceResult =
  | { ok: true; session: NabzSession; addedSignal: TasteDimension }
  | { ok: false; error: string };

export interface TasteSummaryItem {
  dimension: TasteDimension;
  label: string;
  score: number;
}

export interface TasteEvidenceSource {
  duelId: string;
  prompt: string;
  placeId: NabzPlaceId;
  placeName: string;
  contribution: number;
  reason?: string;
}

export interface TasteEvidenceItem extends TasteSummaryItem {
  sources: readonly TasteEvidenceSource[];
}

const SCENARIO_SIGNAL_BONUSES: Record<
  NabzScenarioId,
  Partial<Record<TasteDimension, number>>
> = {
  date: { cozy: 2, quiet: 1 },
  laptop: { quiet: 2, service: 1, value: 1 },
  budget: { value: 2, service: 1 },
  "local-food": { local: 2, cozy: 1 },
};

function emptyScores(): TasteScores {
  return {
    cozy: 0,
    quiet: 0,
    value: 0,
    local: 0,
    social: 0,
    service: 0,
  };
}

function strongestDimension(signals: TasteScores): TasteDimension {
  return TASTE_DIMENSIONS.reduce((strongest, dimension) =>
    signals[dimension] > signals[strongest] ? dimension : strongest,
  );
}

export function getScenarioWeightedSignals(
  place: NabzPlace,
  scenarioId: NabzScenarioId,
): TasteScores {
  return TASTE_DIMENSIONS.reduce<TasteScores>((weighted, dimension) => {
    const base = place.signals[dimension];
    weighted[dimension] =
      base === 0 ? 0 : base + (SCENARIO_SIGNAL_BONUSES[scenarioId][dimension] ?? 0);
    return weighted;
  }, emptyScores());
}

export function createEmptyNabzSession(scenarioId: NabzScenarioId): NabzSession {
  return { scenarioId, choices: [], scores: emptyScores() };
}

export function recordDuelChoice(
  session: NabzSession,
  duel: NabzDuel,
  selectedPlaceId: NabzPlaceId,
  reason?: string,
): RecordChoiceResult {
  if (!duel.options.includes(selectedPlaceId)) {
    return { ok: false, error: "این گزینه در دوئل فعلی نیست." };
  }

  if (session.choices.some((choice) => choice.duelId === duel.id)) {
    return { ok: false, error: "رأی این دوئل قبلاً ثبت شده است." };
  }

  const selectedPlace = NABZ_DEMO_PLACES.find((place) => place.id === selectedPlaceId);
  if (!selectedPlace) {
    return { ok: false, error: "کسب‌وکار انتخاب‌شده پیدا نشد." };
  }

  const weightedSignals = getScenarioWeightedSignals(
    selectedPlace,
    session.scenarioId,
  );
  const addedSignal = strongestDimension(weightedSignals);
  const normalizedReason = reason?.trim().slice(0, 120);
  const nextScores = TASTE_DIMENSIONS.reduce<TasteScores>(
    (scores, dimension) => ({
      ...scores,
      [dimension]: scores[dimension] + weightedSignals[dimension],
    }),
    { ...session.scores },
  );

  return {
    ok: true,
    addedSignal,
    session: {
      ...session,
      scores: nextScores,
      choices: [
        ...session.choices,
        {
          duelId: duel.id,
          selectedPlaceId,
          strongestSignal: addedSignal,
          ...(normalizedReason ? { reason: normalizedReason } : {}),
        },
      ],
    },
  };
}

export function buildTasteEvidence(
  session: NabzSession,
  scenario: NabzScenario,
): readonly TasteEvidenceItem[] {
  const sourcesByDimension = new Map<TasteDimension, TasteEvidenceSource[]>();

  for (const choice of session.choices) {
    const duel = scenario.duels.find((candidate) => candidate.id === choice.duelId);
    const place = NABZ_DEMO_PLACES.find(
      (candidate) => candidate.id === choice.selectedPlaceId,
    );
    if (!duel || !place) {
      continue;
    }

    const contributions = getScenarioWeightedSignals(place, session.scenarioId);
    for (const dimension of TASTE_DIMENSIONS) {
      if (contributions[dimension] <= 0) {
        continue;
      }

      const sources = sourcesByDimension.get(dimension) ?? [];
      sources.push({
        duelId: choice.duelId,
        prompt: duel.prompt,
        placeId: place.id,
        placeName: place.name,
        contribution: contributions[dimension],
        ...(choice.reason ? { reason: choice.reason } : {}),
      });
      sourcesByDimension.set(dimension, sources);
    }
  }

  return summarizeTaste(session.scores).ordered
    .filter((item) => item.score > 0)
    .map((item) => ({
      ...item,
      sources: (sourcesByDimension.get(item.dimension) ?? [])
        .sort((left, right) => right.contribution - left.contribution)
        .slice(0, 3),
    }));
}

export function summarizeTaste(scores: TasteScores): {
  primary: TasteSummaryItem;
  secondary: TasteSummaryItem;
  ordered: readonly TasteSummaryItem[];
} {
  const ordered = TASTE_DIMENSIONS.map((dimension) => ({
    dimension,
    label: TASTE_DIMENSION_LABELS[dimension],
    score: scores[dimension],
  })).sort((a, b) => b.score - a.score);

  return {
    primary: ordered[0],
    secondary: ordered[1],
    ordered,
  };
}

export function findDemoPlace(placeId: NabzPlaceId): NabzPlace {
  const place = NABZ_DEMO_PLACES.find((candidate) => candidate.id === placeId);
  if (!place) {
    throw new Error(`Demo place not found: ${placeId}`);
  }
  return place;
}
