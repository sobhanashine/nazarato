import {
  NABZ_DEMO_PLACES,
  TASTE_DIMENSION_LABELS,
  TASTE_DIMENSIONS,
  type NabzDuel,
  type NabzPlace,
  type NabzPlaceId,
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

export interface NabzRecommendation {
  place: NabzPlace;
  score: number;
  reasons: readonly string[];
}

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

  const addedSignal = strongestDimension(selectedPlace.signals);
  const normalizedReason = reason?.trim().slice(0, 120);
  const nextScores = TASTE_DIMENSIONS.reduce<TasteScores>(
    (scores, dimension) => ({
      ...scores,
      [dimension]: scores[dimension] + selectedPlace.signals[dimension],
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

export function getNabzRecommendations(
  places: readonly NabzPlace[],
  scores: TasteScores,
  limit: number,
): readonly NabzRecommendation[] {
  if (limit <= 0 || Object.values(scores).every((score) => score === 0)) {
    return [];
  }

  return places
    .map((place) => {
      const score = TASTE_DIMENSIONS.reduce(
        (total, dimension) => total + scores[dimension] * place.signals[dimension],
        0,
      );
      const reasons = TASTE_DIMENSIONS.filter(
        (dimension) => scores[dimension] > 0 && place.signals[dimension] >= 2,
      )
        .sort(
          (a, b) =>
            scores[b] * place.signals[b] - scores[a] * place.signals[a],
        )
        .slice(0, 2)
        .map((dimension) => TASTE_DIMENSION_LABELS[dimension]);

      return { place, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name, "fa"))
    .slice(0, limit);
}

export function findDemoPlace(placeId: NabzPlaceId): NabzPlace {
  const place = NABZ_DEMO_PLACES.find((candidate) => candidate.id === placeId);
  if (!place) {
    throw new Error(`Demo place not found: ${placeId}`);
  }
  return place;
}
