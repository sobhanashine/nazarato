import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  businessMatchesSubcategory,
  businessDetails,
  getBusiness,
  getBusinessesByCategory,
  getSimilarBusinesses,
  toPublicBusinessAttributions,
} from "./businesses";
import { supabaseAdmin } from "@/lib/supabase/server";

// Mock the server file that returns the supabaseAdmin client
vi.mock("@/lib/supabase/server", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn(), // to allow awaiting the query
  };
  return {
    supabaseAdmin: () => mockSupabase,
  };
});

describe("businessMatchesSubcategory", () => {
  it("matches generic subcategory by name/description/category keyword", () => {
    const mockBiz = {
      name: "کافه تست",
      description: "یک کافه عالی",
      category: "رستوران",
      info: [{ label: "نوع فضا", value: "کافه" }],
    };

    expect(businessMatchesSubcategory(mockBiz, "همه")).toBe(true);
    expect(businessMatchesSubcategory(mockBiz, "کافه")).toBe(true);
    expect(businessMatchesSubcategory(mockBiz, "رستوران")).toBe(true);
    expect(businessMatchesSubcategory(mockBiz, "دیجیتال")).toBe(false);
  });
});

describe("public business provenance", () => {
  let mockSupabaseClient: {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    neq: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    then: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSupabaseClient = supabaseAdmin() as unknown as typeof mockSupabaseClient;
    vi.clearAllMocks();
  });

  it("fails closed unless a direct profile is public and has an approved source", async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: { message: "No public row" },
    });

    await expect(getBusiness("quarantined-cafe")).resolves.toBeUndefined();

    expect(mockSupabaseClient.in).toHaveBeenCalledWith("status", [
      "active",
      "merged",
    ]);
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
      "business_sources.status",
      "approved",
    );
    expect(mockSupabaseClient.select).toHaveBeenCalledWith(
      expect.stringContaining("business_sources!inner"),
    );
  });

  it("excludes unapproved profiles from similar-business results", async () => {
    mockSupabaseClient.then.mockImplementation(
      (callback: (value: unknown) => unknown) =>
        Promise.resolve(callback({ data: [], error: null })),
    );

    await getSimilarBusinesses({
      ...businessDetails[0],
      similar: ["quarantined-cafe"],
    });

    expect(mockSupabaseClient.in).toHaveBeenCalledWith("status", [
      "active",
      "merged",
    ]);
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
      "business_sources.status",
      "approved",
    );
  });

  it("keeps only complete HTTPS attribution records", () => {
    expect(
      toPublicBusinessAttributions([
        {
          source_type: "open_dataset",
          source_ref: "https://www.openstreetmap.org/node/1",
          license_name: "ODbL-1.0",
          license_url: "https://opendatacommons.org/licenses/odbl/1-0/",
          attribution_text: "© OpenStreetMap contributors",
          status: "approved",
        },
        {
          source_type: "open_dataset",
          source_ref: "javascript:alert(1)",
          license_name: "unsafe",
          license_url: "https://example.test/license",
          attribution_text: "unsafe source",
          status: "approved",
        },
        {
          source_type: "open_dataset",
          source_ref: "https://example.test/quarantined",
          license_name: "Example",
          license_url: "https://example.test/license",
          attribution_text: "not approved",
          status: "quarantined",
        },
      ]),
    ).toEqual([
      {
        sourceType: "open_dataset",
        sourceUrl: "https://www.openstreetmap.org/node/1",
        licenseName: "ODbL-1.0",
        licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
        attributionText: "© OpenStreetMap contributors",
      },
    ]);
  });
});

describe("getBusinessesByCategory", () => {
  let mockSupabaseClient: {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    neq: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    then: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSupabaseClient = supabaseAdmin() as unknown as typeof mockSupabaseClient;
    vi.clearAllMocks();
  });

  it("successfully retrieves and maps active businesses under category_slug", async () => {
    const mockDbData = [
      {
        slug: "digikala",
        name: "دیجی‌کالا",
        category_slug: "digital",
        city: "تهران",
        initial: "د",
        color: "#EF4444",
        rating_avg: 4.2,
        review_count: 5,
        verified: true,
        description: "بزرگترین فروشگاه اینترنتی ایران",
        info: [{ label: "نوع", value: "خرده‌فروشی آنلاین" }],
      },
    ];

    // Mock query promise resolution
    mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
      Promise.resolve(callback({ data: mockDbData, error: null }))
    );

    const result = await getBusinessesByCategory("digital", {
      sort: "rating",
      subcategory: "همه",
      page: 1,
      limit: 6,
    });

    expect(mockSupabaseClient.from).toHaveBeenCalledWith("businesses");
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith("category_slug", "digital");
    expect(result.businesses).toHaveLength(1);
    expect(result.businesses[0].name).toBe("دیجی‌کالا");
    expect(result.businesses[0].score).toBe("۴٫۲"); // Persian formatted
    expect(result.total).toBe(1);
  });

  it("filters listings by subcategory client-side", async () => {
    const mockDbData = [
      {
        slug: "snappfood",
        name: "اسنپ‌فود",
        category_slug: "food",
        city: "تهران",
        initial: "ا",
        color: "#EC4899",
        rating_avg: 3.5,
        review_count: 2,
        verified: true,
        description: "سفارش آنلاین غذا",
      },
      {
        slug: "cafe-naderi",
        name: "کافه نادری",
        category_slug: "food",
        city: "تهران",
        initial: "ک",
        color: "#F59E0B",
        rating_avg: 4.5,
        review_count: 3,
        verified: false,
        description: "کافه‌ای نوستالژیک",
      },
    ];

    mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
      Promise.resolve(callback({ data: mockDbData, error: null }))
    );

    const result = await getBusinessesByCategory("food", {
      subcategory: "کافه",
    });

    expect(result.businesses).toHaveLength(1);
    expect(result.businesses[0].slug).toBe("cafe-naderi");
    expect(result.total).toBe(1);
  });

  it("returns empty list and 0 count if database query fails", async () => {
    mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
      Promise.resolve(callback({ data: null, error: new Error("DB Error") }))
    );

    const result = await getBusinessesByCategory("food");

    expect(result.businesses).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
