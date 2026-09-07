import type { OsmReviewCandidate } from "./osm-review";

export type OsmPublicationApprovalInput = {
  sourceId: string;
  confirmationSlug: string;
  identityConfirmed: true;
  scopeConfirmed: true;
  attributionConfirmed: true;
};

export type OsmPublicationApprovalValidation =
  | { ok: true; value: OsmPublicationApprovalInput }
  | { ok: false; error: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OSM_SLUG_PATTERN = /^rasht-osm-(node|way|relation)-[1-9][0-9]*$/;

export function validateOsmPublicationApprovalInput(
  value: unknown,
): OsmPublicationApprovalValidation {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, error: "اطلاعات تأیید انتشار معتبر نیست." };
  }

  const input = value as Record<string, unknown>;
  const sourceId = input.sourceId;
  const confirmationSlug = input.confirmationSlug;
  const identityConfirmed = input.identityConfirmed;
  const scopeConfirmed = input.scopeConfirmed;
  const attributionConfirmed = input.attributionConfirmed;
  if (
    typeof sourceId !== "string" ||
    !UUID_PATTERN.test(sourceId) ||
    typeof confirmationSlug !== "string" ||
    identityConfirmed !== true ||
    scopeConfirmed !== true ||
    attributionConfirmed !== true
  ) {
    return { ok: false, error: "اطلاعات تأیید انتشار معتبر نیست." };
  }

  const normalizedSlug = confirmationSlug.trim().toLocaleLowerCase("en-US");
  if (!OSM_SLUG_PATTERN.test(normalizedSlug)) {
    return { ok: false, error: "شناسه تأیید با قالب رکورد OSM مطابقت ندارد." };
  }

  return {
    ok: true,
    value: {
      sourceId,
      confirmationSlug: normalizedSlug,
      identityConfirmed,
      scopeConfirmed,
      attributionConfirmed,
    },
  };
}

export function canApproveOsmPublication(
  candidate: OsmReviewCandidate,
): boolean {
  const expectedSourceUrl = `https://www.openstreetmap.org/${candidate.slug
    .replace(/^rasht-osm-/, "")
    .replace("-", "/")}`;
  return (
    candidate.reviewState === "ready_for_approval" &&
    candidate.prescreen.version === "nazarato-osm-prescreen/0.1.0" &&
    candidate.prescreen.recommendation === "low_risk_review" &&
    candidate.prescreen.score >= 75 &&
    candidate.sourceWarning === null &&
    candidate.sourceUrl === expectedSourceUrl &&
    candidate.licenseName === "ODbL-1.0" &&
    candidate.licenseUrl === "https://www.openstreetmap.org/copyright" &&
    candidate.attributionText === "© OpenStreetMap contributors" &&
    candidate.latitude !== null &&
    candidate.longitude !== null
  );
}
