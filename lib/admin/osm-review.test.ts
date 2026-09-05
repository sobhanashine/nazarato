import { describe, expect, it } from "vitest";
import {
  attachOsmSourceReviewEvents,
  filterOsmReviewCandidates,
  parseOsmReviewRows,
  sortOsmReviewCandidatesForReview,
  summarizeOsmReviewCandidates,
} from "./osm-review";

function rawRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    source_type: "open_dataset",
    source_ref: "https://www.openstreetmap.org/node/101",
    permission_basis: "open_license",
    license_name: "ODbL-1.0",
    license_url: "https://www.openstreetmap.org/copyright",
    attribution_text: "© OpenStreetMap contributors",
    field_payload: {
      contact: {
        phone: "+981333112233",
        instagram: "cafe_rasht",
        address: "رشت، گلسار",
      },
    },
    captured_at: "2026-09-02T19:07:36.000Z",
    status: "quarantined",
    businesses: {
      id: "20000000-0000-4000-8000-000000000001",
      name: "کافه باران",
      slug: "rasht-osm-node-101",
      category_slug: "cafe",
      city: "رشت",
      status: "pending",
      latitude: 37.28,
      longitude: 49.58,
    },
    ...overrides,
  };
}

describe("parseOsmReviewRows", () => {
  it("returns a minimal review DTO and calculates factual completeness", () => {
    const [item] = parseOsmReviewRows([rawRow()]);

    expect(item).toMatchObject({
      name: "کافه باران",
      category: "cafe",
      businessStatus: "pending",
      sourceStatus: "quarantined",
      sourceUrl: "https://www.openstreetmap.org/node/101",
      licenseUrl: "https://www.openstreetmap.org/copyright",
      completenessScore: 3,
      completenessTotal: 4,
      missingFields: ["وب‌سایت"],
      prescreen: {
        version: "nazarato-osm-prescreen/0.1.0",
        recommendation: "low_risk_review",
        score: 100,
      },
    });
    expect(item.contact).toEqual({
      phone: "+981333112233",
      instagram: "cafe_rasht",
      address: "رشت، گلسار",
    });
    expect(item).not.toHaveProperty("field_payload");
  });

  it("does not expose a source or licence link outside the reviewed allowlist", () => {
    const [item] = parseOsmReviewRows([
      rawRow({
        source_ref: "https://example.com/phishing",
        license_url: "javascript:alert(1)",
      }),
    ]);

    expect(item.sourceUrl).toBeNull();
    expect(item.licenseUrl).toBeNull();
    expect(item.sourceWarning).toBe("لینک منبع یا مجوز با قرارداد OSM تطابق ندارد");
  });

  it("rejects rows that are not pending and quarantined OSM candidates", () => {
    expect(() =>
      parseOsmReviewRows([rawRow({ status: "approved" })]),
    ).toThrow("unexpected OSM review row");
  });
});

describe("OSM review filters", () => {
  it("filters by normalized Persian query, category, and completeness", () => {
    const items = parseOsmReviewRows([
      rawRow(),
      rawRow({
        id: "10000000-0000-4000-8000-000000000002",
        source_ref: "https://www.openstreetmap.org/way/202",
        field_payload: { contact: {} },
        businesses: {
          id: "20000000-0000-4000-8000-000000000002",
          name: "رستوران گيلان",
          slug: "rasht-osm-way-202",
          category_slug: "restaurant",
          city: "رشت",
          status: "pending",
          latitude: 37.3,
          longitude: 49.6,
        },
      }),
    ]);

    expect(
      filterOsmReviewCandidates(items, {
        query: "گیلان",
        category: "restaurant",
        completeness: "incomplete",
      }).map((item) => item.slug),
    ).toEqual(["rasht-osm-way-202"]);
    expect(summarizeOsmReviewCandidates(items)).toEqual({
      total: 2,
      cafes: 1,
      restaurants: 1,
      complete: 0,
      withPhone: 1,
      lowRiskReview: 1,
      needsCompletion: 1,
      highRiskException: 0,
    });
  });

  it("filters by the machine recommendation without changing human review state", () => {
    const items = parseOsmReviewRows([
      rawRow(),
      rawRow({
        id: "10000000-0000-4000-8000-000000000002",
        source_ref: "https://www.openstreetmap.org/way/202",
        field_payload: { contact: { phone: "+981333112244" } },
        businesses: {
          id: "20000000-0000-4000-8000-000000000002",
          name: "رستوران گیلان",
          slug: "rasht-osm-way-202",
          category_slug: "restaurant",
          city: "رشت",
          status: "pending",
          latitude: 37.3,
          longitude: 49.6,
        },
      }),
    ]);

    const [needsCompletion] = filterOsmReviewCandidates(items, {
      query: "",
      category: "all",
      completeness: "all",
      prescreen: "needs_completion",
    });

    expect(needsCompletion.slug).toBe("rasht-osm-way-202");
    expect(needsCompletion.reviewState).toBe("unreviewed");
  });

  it("orders exceptions and completion work before low-risk records", () => {
    const items = parseOsmReviewRows([
      rawRow(),
      rawRow({
        id: "10000000-0000-4000-8000-000000000002",
        source_ref: "https://www.openstreetmap.org/way/202",
        field_payload: { contact: { phone: "+981333112244" } },
        businesses: {
          id: "20000000-0000-4000-8000-000000000002",
          name: "رستوران تکمیل",
          slug: "rasht-osm-way-202",
          category_slug: "restaurant",
          city: "رشت",
          status: "pending",
          latitude: 37.3,
          longitude: 49.6,
        },
      }),
      rawRow({
        id: "10000000-0000-4000-8000-000000000003",
        source_ref: "https://www.openstreetmap.org/relation/303",
        businesses: {
          id: "20000000-0000-4000-8000-000000000003",
          name: "کافه استثنا",
          slug: "rasht-osm-relation-303",
          category_slug: "cafe",
          city: "رشت",
          status: "pending",
          latitude: 35.7,
          longitude: 51.4,
        },
      }),
    ]);

    expect(
      sortOsmReviewCandidatesForReview(items).map(
        (item) => item.prescreen.recommendation,
      ),
    ).toEqual([
      "high_risk_exception",
      "needs_completion",
      "low_risk_review",
    ]);
  });

  it("attaches newest-first review history and filters by its current state", () => {
    const [candidate] = parseOsmReviewRows([rawRow()]);
    const [reviewed] = attachOsmSourceReviewEvents([candidate], [
      {
        id: "30000000-0000-4000-8000-000000000001",
        source_id: candidate.sourceId,
        decision: "needs_correction",
        note: "شماره تماس بررسی شود",
        criteria_snapshot: {
          has_phone: true,
          has_address: true,
          has_website: false,
          has_instagram: true,
          valid_source_links: true,
        },
        created_at: "2026-09-05T08:00:00.000Z",
      },
      {
        id: "30000000-0000-4000-8000-000000000002",
        source_id: candidate.sourceId,
        decision: "ready_for_approval",
        note: null,
        criteria_snapshot: {
          has_phone: true,
          has_address: true,
          has_website: false,
          has_instagram: true,
          valid_source_links: true,
        },
        created_at: "2026-09-05T09:00:00.000Z",
      },
    ]);

    expect(reviewed.reviewState).toBe("ready_for_approval");
    expect(reviewed.reviewHistory.map((event) => event.decision)).toEqual([
      "ready_for_approval",
      "needs_correction",
    ]);
    expect(
      filterOsmReviewCandidates([reviewed], {
        query: "",
        category: "all",
        completeness: "all",
        reviewState: "ready_for_approval",
      }),
    ).toHaveLength(1);
  });
});
