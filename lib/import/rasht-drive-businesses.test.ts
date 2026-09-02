import { describe, expect, it } from "vitest";
import { prepareBusinessImport } from "./business-import";
import {
  buildRashtDriveMatchReport,
  buildRashtDriveSnapshot,
} from "./rasht-drive-businesses";

const DRIVE_EXPORT = {
  manifest: {
    spreadsheetId: "drive-sheet-1",
    spreadsheetTitle: "کسب کارهای ایران, رشت",
    sourceModifiedAt: "2026-08-24T16:39:05.190Z",
    capturedAt: "2026-09-02T19:31:52.959Z",
    selection: "Rasht cafe and restaurant rows only.",
  },
  rows: [
    {
      sheetId: 883318692,
      sheetTitle: "رستوران ها",
      rowNumber: 3,
      categorySlug: "restaurant",
      name: " پیتزا امیر✅ ",
      instagram: "@amir.pizza",
      phone: "013-33 73 33 12 / 013-33 73 33 13",
      address: "رشت-گلسار-سه راه گلایل",
      website: "www.amirpizza.com",
      rating: "4.2",
      reviewCount: "82",
    },
    {
      sheetId: 1973431864,
      sheetTitle: "کافی شاپ ها",
      rowNumber: 11,
      categorySlug: "cafe",
      name: "کافه کتاب سایه⚠️",
      instagram: "sayebookcafe",
      phone: "0912-344-09 73",
      address: "رشت- بوستان ملت",
      website: "sayebookcafe.com",
    },
  ],
};

describe("buildRashtDriveSnapshot", () => {
  it("normalizes factual fields, separates legacy markers, and quarantines every row", () => {
    const result = buildRashtDriveSnapshot(DRIVE_EXPORT);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.records).toHaveLength(2);
    expect(result.value.manifest).toMatchObject({
      selectedCount: 2,
      permissionBasis: "unknown",
      publicationApproved: false,
      excludedSourceFields: ["rating", "reviewCount"],
    });

    const [restaurant, cafe] = result.value.records;
    expect(restaurant.legacyStatus).toBe("positive");
    expect(restaurant.importInput.business).toMatchObject({
      slug: "rasht-drive-883318692-3",
      name: "پیتزا امیر",
      categorySlug: "restaurant",
      city: "رشت",
      contact: {
        instagram: "amir.pizza",
        phone: "+981333733312;+981333733313",
        address: "رشت، گلسار، سه راه گلایل",
        website: "https://www.amirpizza.com/",
      },
    });
    expect(restaurant.importInput.business).not.toHaveProperty("rating");
    expect(restaurant.importInput.business).not.toHaveProperty("reviewCount");
    expect(restaurant.importInput.source).toMatchObject({
      sourceType: "manual_public_facts",
      permissionBasis: "unknown",
      publicationApproved: false,
    });

    expect(cafe.legacyStatus).toBe("needs_review");
    expect(cafe.importInput.business.name).toBe("کافه کتاب سایه");
    for (const record of result.value.records) {
      const prepared = prepareBusinessImport(record.importInput);
      expect(prepared.ok).toBe(true);
      if (!prepared.ok) continue;
      expect(prepared.value.publishable).toBe(false);
      expect(prepared.value.business.status).toBe("pending");
      expect(prepared.value.source.status).toBe("quarantined");
    }
  });

  it("omits malformed contact facts instead of preserving misleading values", () => {
    const result = buildRashtDriveSnapshot({
      ...DRIVE_EXPORT,
      rows: [
        {
          sheetId: 883318692,
          sheetTitle: "رستوران ها",
          rowNumber: 7,
          categorySlug: "restaurant",
          name: "کباب مهدی❌",
          instagram: "not a handle",
          phone: "013-32 036",
          address: "رشت-نامجو",
          website: "-----",
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.records[0].legacyStatus).toBe("negative");
    expect(result.value.records[0].importInput.business.contact).toEqual({
      address: "رشت، نامجو",
    });
  });

  it("rejects malformed rows and duplicate source locations", () => {
    const malformed = buildRashtDriveSnapshot({
      ...DRIVE_EXPORT,
      rows: [
        { ...DRIVE_EXPORT.rows[0], name: "" },
        { ...DRIVE_EXPORT.rows[0] },
      ],
    });

    expect(malformed.ok).toBe(false);
    if (malformed.ok) return;
    expect(malformed.issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(["rows.0.name", "rows.1"]),
    );
  });
});

describe("buildRashtDriveMatchReport", () => {
  it("separates exact matches from review-only fuzzy candidates", () => {
    const drive = buildRashtDriveSnapshot(DRIVE_EXPORT);
    expect(drive.ok).toBe(true);
    if (!drive.ok) return;

    const report = buildRashtDriveMatchReport(drive.value, {
      imports: [
        {
          business: { name: "کافه کتاب سایه", categorySlug: "cafe" },
          source: { sourceRef: "https://www.openstreetmap.org/node/1" },
        },
        {
          business: { name: "پیتزا امیر گلسار", categorySlug: "restaurant" },
          source: { sourceRef: "https://www.openstreetmap.org/node/2" },
        },
      ],
    });

    expect(report.exactMatches).toEqual([
      expect.objectContaining({
        driveName: "کافه کتاب سایه",
        osmName: "کافه کتاب سایه",
      }),
    ]);
    expect(report.reviewCandidates).toEqual([
      expect.objectContaining({
        driveName: "پیتزا امیر",
        osmName: "پیتزا امیر گلسار",
      }),
    ]);
    expect(report.autoMergedCount).toBe(0);
  });
});
