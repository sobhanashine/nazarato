import type { OsmReviewCandidate, OsmReviewContact } from "./osm-review";

export const OSM_SOURCE_REVIEW_DECISIONS = [
  "unreviewed",
  "needs_correction",
  "ready_for_approval",
  "rejected",
] as const;

export type OsmSourceReviewDecision =
  (typeof OSM_SOURCE_REVIEW_DECISIONS)[number];

export type OsmSourceCriteriaSnapshot = {
  has_phone: boolean;
  has_address: boolean;
  has_website: boolean;
  has_instagram: boolean;
  valid_source_links: boolean;
};

export type OsmSourceReviewEvent = {
  id: string;
  sourceId: string;
  decision: OsmSourceReviewDecision;
  note: string | null;
  criteriaSnapshot: OsmSourceCriteriaSnapshot;
  createdAt: string;
};

export type OsmSourceReviewInput = {
  sourceId: string;
  decision: OsmSourceReviewDecision;
  note: string | null;
};

export type OsmSourceReviewValidation =
  | { ok: true; value: OsmSourceReviewInput }
  | { ok: false; error: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NOTE_MAX_LENGTH = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("unexpected OSM source review event");
  }
  return value.trim();
}

function parseCriteriaSnapshot(value: unknown): OsmSourceCriteriaSnapshot {
  if (!isRecord(value)) throw new Error("unexpected OSM source review event");
  const keys = [
    "has_phone",
    "has_address",
    "has_website",
    "has_instagram",
    "valid_source_links",
  ] as const;
  for (const key of keys) {
    if (typeof value[key] !== "boolean") {
      throw new Error("unexpected OSM source review event");
    }
  }
  return {
    has_phone: value.has_phone as boolean,
    has_address: value.has_address as boolean,
    has_website: value.has_website as boolean,
    has_instagram: value.has_instagram as boolean,
    valid_source_links: value.valid_source_links as boolean,
  };
}

export function isOsmSourceReviewDecision(
  value: unknown,
): value is OsmSourceReviewDecision {
  return (
    typeof value === "string" &&
    OSM_SOURCE_REVIEW_DECISIONS.some((decision) => decision === value)
  );
}

export function validateOsmSourceReviewInput(
  value: unknown,
): OsmSourceReviewValidation {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, error: "اطلاعات تصمیم معتبر نیست." };
  }

  const input = value as Record<string, unknown>;
  const sourceId = input.sourceId;
  const decision = input.decision;
  const rawNote = input.note;
  if (
    typeof sourceId !== "string" ||
    !UUID_PATTERN.test(sourceId) ||
    !isOsmSourceReviewDecision(decision) ||
    (rawNote !== undefined && rawNote !== null && typeof rawNote !== "string")
  ) {
    return { ok: false, error: "اطلاعات تصمیم معتبر نیست." };
  }

  const note = typeof rawNote === "string" ? rawNote.trim() : "";
  if (note.length > NOTE_MAX_LENGTH) {
    return { ok: false, error: "اطلاعات تصمیم معتبر نیست." };
  }
  if (
    (decision === "needs_correction" || decision === "rejected") &&
    note.length === 0
  ) {
    return { ok: false, error: "برای این تصمیم توضیح لازم است." };
  }

  return {
    ok: true,
    value: { sourceId, decision, note: note || null },
  };
}

export function buildOsmSourceCriteriaSnapshot(input: {
  contact: OsmReviewContact;
  sourceUrl: string | null;
  licenseUrl: string | null;
}): OsmSourceCriteriaSnapshot {
  return {
    has_phone: Boolean(input.contact.phone),
    has_address: Boolean(input.contact.address),
    has_website: Boolean(input.contact.website),
    has_instagram: Boolean(input.contact.instagram),
    valid_source_links: Boolean(input.sourceUrl && input.licenseUrl),
  };
}

export function criteriaSnapshotForCandidate(
  candidate: OsmReviewCandidate,
): OsmSourceCriteriaSnapshot {
  return buildOsmSourceCriteriaSnapshot(candidate);
}

export function parseOsmSourceReviewEvents(
  value: unknown,
): OsmSourceReviewEvent[] {
  if (!Array.isArray(value)) {
    throw new Error("unexpected OSM source review response");
  }
  return value.map((rawEvent) => {
    if (!isRecord(rawEvent) || !isOsmSourceReviewDecision(rawEvent.decision)) {
      throw new Error("unexpected OSM source review event");
    }
    if (rawEvent.note !== null && typeof rawEvent.note !== "string") {
      throw new Error("unexpected OSM source review event");
    }
    return {
      id: requiredString(rawEvent.id),
      sourceId: requiredString(rawEvent.source_id),
      decision: rawEvent.decision,
      note: rawEvent.note?.trim() || null,
      criteriaSnapshot: parseCriteriaSnapshot(rawEvent.criteria_snapshot),
      createdAt: requiredString(rawEvent.created_at),
    };
  });
}

export function attachOsmSourceReviewEvents(
  candidates: OsmReviewCandidate[],
  rawEvents: unknown,
): OsmReviewCandidate[] {
  const events = parseOsmSourceReviewEvents(rawEvents).sort((left, right) => {
    const dateOrder = right.createdAt.localeCompare(left.createdAt);
    return dateOrder || right.id.localeCompare(left.id);
  });
  const eventsBySource = new Map<string, OsmSourceReviewEvent[]>();
  for (const event of events) {
    const history = eventsBySource.get(event.sourceId) ?? [];
    history.push(event);
    eventsBySource.set(event.sourceId, history);
  }
  return candidates.map((candidate) => {
    const reviewHistory = eventsBySource.get(candidate.sourceId) ?? [];
    return {
      ...candidate,
      reviewState: reviewHistory[0]?.decision ?? "unreviewed",
      reviewHistory,
    };
  });
}
