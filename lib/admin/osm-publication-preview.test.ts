import { describe, expect, it } from "vitest";
import type { OsmReviewCandidate } from "./osm-review";
import { buildOsmPublicationPreview } from "./osm-publication-preview";

function readyCandidate(): OsmReviewCandidate {
  return {
    sourceId: "10000000-0000-4000-8000-000000000001",
    businessId: "20000000-0000-4000-8000-000000000001",
    name: "رستوران گیله مرد اصیل",
    slug: "rasht-osm-node-101",
    category: "restaurant",
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
    contact: {
      phone: "+981333112233",
      address: "رشت، گلسار",
      website: "https://example.com/a/very/long/path",
      instagram: "gile_mard",
    },
    completenessScore: 4,
    completenessTotal: 4,
    missingFields: [],
    prescreen: {
      version: "nazarato-osm-prescreen/0.1.0",
      recommendation: "low_risk_review",
      score: 90,
      reasonCodes: [
        "valid_provenance",
        "rasht_coordinates",
        "phone_present",
        "address_present",
        "digital_channel_present",
      ],
    },
    reviewState: "ready_for_approval",
    reviewHistory: [],
    completionProposals: [],
  };
}

describe("OSM publication preview", () => {
  it("builds the exact factual payload and attribution for an eligible candidate", () => {
    expect(buildOsmPublicationPreview(readyCandidate())).toEqual({
      status: "ready",
      identity: {
        name: "رستوران گیله مرد اصیل",
        category: "رستوران",
        city: "رشت",
        latitude: 37.28,
        longitude: 49.58,
      },
      contact: [
        { label: "تلفن", value: "+981333112233", direction: "ltr" },
        { label: "نشانی", value: "رشت، گلسار", direction: "rtl" },
        {
          label: "وب‌سایت",
          value: "https://example.com/a/very/long/path",
          direction: "ltr",
        },
        { label: "اینستاگرام", value: "@gile_mard", direction: "ltr" },
      ],
      attribution: {
        text: "© OpenStreetMap contributors",
        sourceUrl: "https://www.openstreetmap.org/node/101",
        licenseName: "ODbL-1.0",
        licenseUrl: "https://www.openstreetmap.org/copyright",
      },
      excluded: [
        "نظرها و امتیازهای پلتفرم‌های دیگر",
        "تصویر یا توضیحات تبلیغاتی منبع ثالث",
        "نشان مالکیت یا تأیید کسب‌وکار",
      ],
    });
  });

  it("fails closed when the source and license links are missing or invalid", () => {
    const candidate = readyCandidate();
    expect(
      buildOsmPublicationPreview({
        ...candidate,
        sourceUrl: null,
        licenseUrl: null,
        sourceWarning: "لینک منبع یا مجوز با قرارداد OSM تطابق ندارد",
      }),
    ).toEqual({
      status: "blocked",
      reason:
        "پیش‌نمایش امن ساخته نشد؛ لینک منبع OSM یا مجوز ODbL معتبر نیست.",
    });
  });

  it("fails closed when a candidate is not ready or has no coordinates", () => {
    expect(
      buildOsmPublicationPreview({
        ...readyCandidate(),
        reviewState: "unreviewed",
      }),
    ).toEqual({
      status: "blocked",
      reason: "این گزینه هنوز برای پیش‌نمایش قبل از انتشار آماده نیست.",
    });

    expect(
      buildOsmPublicationPreview({
        ...readyCandidate(),
        latitude: null,
      }),
    ).toEqual({
      status: "blocked",
      reason: "پیش‌نمایش امن ساخته نشد؛ مختصات کسب‌وکار کامل نیست.",
    });
  });
});
