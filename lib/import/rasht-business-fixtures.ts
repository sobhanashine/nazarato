/**
 * Synthetic, deterministic fixtures for importer and UI development.
 * They represent no real business and stay quarantined by construction.
 */
export const rashtBusinessImportFixtures: readonly unknown[] = [
  {
    business: {
      slug: "fixture-golsar-cafe",
      name: "کافه نمونه گلسار",
      categorySlug: "cafe",
      city: "رشت",
      neighborhoodSlug: "golsar",
      latitude: 37.2992,
      longitude: 49.5841,
      priceBand: 2,
      contact: { address: "رشت، گلسار — داده آزمایشی" },
    },
    source: {
      sourceType: "development_fixture",
      sourceRef: "fixture://rasht/golsar-cafe/v1",
      permissionBasis: "unknown",
      capturedAt: "2026-09-02T00:00:00.000Z",
    },
  },
  {
    business: {
      slug: "fixture-shahrdari-restaurant",
      name: "رستوران نمونه شهرداری",
      categorySlug: "restaurant",
      city: "رشت",
      neighborhoodSlug: "shahrdari",
      latitude: 37.2756,
      longitude: 49.5887,
      priceBand: 3,
      contact: { address: "رشت، میدان شهرداری — داده آزمایشی" },
    },
    source: {
      sourceType: "development_fixture",
      sourceRef: "fixture://rasht/shahrdari-restaurant/v1",
      permissionBasis: "unknown",
      capturedAt: "2026-09-02T00:00:00.000Z",
    },
  },
  {
    business: {
      slug: "fixture-sagharisazan-cafe",
      name: "کافه نمونه ساغری‌سازان",
      categorySlug: "cafe",
      city: "رشت",
      neighborhoodSlug: "sagharisazan",
      priceBand: 1,
      contact: { address: "رشت، ساغری‌سازان — داده آزمایشی" },
    },
    source: {
      sourceType: "development_fixture",
      sourceRef: "fixture://rasht/sagharisazan-cafe/v1",
      permissionBasis: "unknown",
      capturedAt: "2026-09-02T00:00:00.000Z",
    },
  },
];
