import { describe, expect, it } from "vitest";
import type { OsmReviewCandidate } from "./osm-review";
import {
  canApproveOsmPublication,
  validateOsmPublicationApprovalInput,
} from "./osm-publication";

const sourceId = "10000000-0000-4000-8000-000000000001";

function eligibleCandidate(): OsmReviewCandidate {
  return {
    sourceId,
    businessId: "20000000-0000-4000-8000-000000000001",
    name: "کافه باران",
    slug: "rasht-osm-node-101",
    category: "cafe",
    city: "رشت",
    businessStatus: "pending",
    sourceStatus: "quarantined",
    sourceUrl: "https://www.openstreetmap.org/node/101",
    licenseName: "ODbL-1.0",
    licenseUrl: "https://www.openstreetmap.org/copyright",
    attributionText: "© OpenStreetMap contributors",
    sourceWarning: null,
    capturedAt: "2026-09-02T19:07:36.000Z",
    latitude: 37.28,
    longitude: 49.58,
    contact: { phone: "+981333112233", address: "رشت، گلسار" },
    completenessScore: 2,
    completenessTotal: 4,
    missingFields: ["اینستاگرام", "وب‌سایت"],
    prescreen: {
      version: "nazarato-osm-prescreen/0.1.0",
      recommendation: "low_risk_review",
      score: 90,
      reasonCodes: [
        "valid_provenance",
        "rasht_coordinates",
        "phone_present",
        "address_present",
        "missing_digital_channel",
      ],
    },
    reviewState: "ready_for_approval",
    reviewHistory: [],
    completionProposals: [],
  };
}

describe("OSM publication approval", () => {
  it("accepts only an exact OSM source id and Rasht OSM confirmation slug", () => {
    expect(
      validateOsmPublicationApprovalInput({
        sourceId,
        confirmationSlug: "  RASHT-OSM-NODE-101  ",
        identityConfirmed: true,
        scopeConfirmed: true,
        attributionConfirmed: true,
      }),
    ).toEqual({
      ok: true,
      value: {
        sourceId,
        confirmationSlug: "rasht-osm-node-101",
        identityConfirmed: true,
        scopeConfirmed: true,
        attributionConfirmed: true,
      },
    });
  });

  it("rejects a generic slug before any privileged database call", () => {
    expect(
      validateOsmPublicationApprovalInput({
        sourceId,
        confirmationSlug: "cafe-baran",
        identityConfirmed: true,
        scopeConfirmed: true,
        attributionConfirmed: true,
      }),
    ).toEqual({
      ok: false,
      error: "شناسه تأیید با قالب رکورد OSM مطابقت ندارد.",
    });
  });

  it("rejects direct action calls that bypass an explicit confirmation", () => {
    expect(
      validateOsmPublicationApprovalInput({
        sourceId,
        confirmationSlug: "rasht-osm-node-101",
        identityConfirmed: true,
        scopeConfirmed: false,
        attributionConfirmed: true,
      }),
    ).toEqual({ ok: false, error: "اطلاعات تأیید انتشار معتبر نیست." });
  });

  it("requires human readiness, the current low-risk model and valid ODbL links", () => {
    expect(canApproveOsmPublication(eligibleCandidate())).toBe(true);
    expect(
      canApproveOsmPublication({
        ...eligibleCandidate(),
        reviewState: "unreviewed",
      }),
    ).toBe(false);
    expect(
      canApproveOsmPublication({
        ...eligibleCandidate(),
        prescreen: {
          ...eligibleCandidate().prescreen,
          recommendation: "needs_completion",
        },
      }),
    ).toBe(false);
    expect(
      canApproveOsmPublication({
        ...eligibleCandidate(),
        licenseUrl: null,
      }),
    ).toBe(false);
    expect(
      canApproveOsmPublication({
        ...eligibleCandidate(),
        sourceUrl: "https://www.openstreetmap.org/node/999",
      }),
    ).toBe(false);
    expect(
      canApproveOsmPublication({
        ...eligibleCandidate(),
        attributionText: "OpenStreetMap",
      }),
    ).toBe(false);
  });
});
