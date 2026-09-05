import { describe, expect, it } from "vitest";
import {
  buildOsmSourceCriteriaSnapshot,
  validateOsmSourceReviewInput,
} from "./osm-source-review";

const sourceId = "10000000-0000-4000-8000-000000000001";

describe("validateOsmSourceReviewInput", () => {
  it("normalizes a valid review decision", () => {
    expect(
      validateOsmSourceReviewInput({
        sourceId,
        decision: "ready_for_approval",
        note: "  منبع و اطلاعات پایه بررسی شد.  ",
      }),
    ).toEqual({
      ok: true,
      value: {
        sourceId,
        decision: "ready_for_approval",
        note: "منبع و اطلاعات پایه بررسی شد.",
      },
    });
  });

  it.each(["needs_correction", "rejected"])(
    "requires a note for %s",
    (decision) => {
      expect(
        validateOsmSourceReviewInput({ sourceId, decision, note: "   " }),
      ).toEqual({ ok: false, error: "برای این تصمیم توضیح لازم است." });
    },
  );

  it("rejects malformed ids, decisions, and oversized notes", () => {
    expect(
      validateOsmSourceReviewInput({
        sourceId: "not-a-uuid",
        decision: "approved",
        note: "x".repeat(501),
      }),
    ).toEqual({ ok: false, error: "اطلاعات تصمیم معتبر نیست." });
  });
});

describe("buildOsmSourceCriteriaSnapshot", () => {
  it("records factual completeness without deciding publication", () => {
    expect(
      buildOsmSourceCriteriaSnapshot({
        contact: { phone: "+981333112233", address: "رشت، گلسار" },
        slug: "rasht-osm-node-101",
        sourceUrl: "https://www.openstreetmap.org/node/101",
        licenseName: "ODbL-1.0",
        licenseUrl: "https://www.openstreetmap.org/copyright",
        attributionText: "© OpenStreetMap contributors",
        latitude: 37.28,
        longitude: 49.58,
      }),
    ).toEqual({
      has_phone: true,
      has_address: true,
      has_website: false,
      has_instagram: false,
      valid_source_links: true,
      prescreen: {
        version: "nazarato-osm-prescreen/0.1.0",
        recommendation: "low_risk_review",
        score: 90,
        reason_codes: [
          "valid_provenance",
          "rasht_coordinates",
          "phone_present",
          "address_present",
          "missing_digital_channel",
        ],
      },
    });
  });
});
