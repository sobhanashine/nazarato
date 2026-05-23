import { describe, it, expect, vi, beforeEach } from "vitest";
import { getInstagramShopsFromDb, getShopByHandle } from "./instagram-shops";
import { supabaseAdmin } from "@/lib/supabase/server";

// Mock the server file that returns the supabaseAdmin client
vi.mock("@/lib/supabase/server", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn(), // to allow awaiting the query
  };
  return {
    supabaseAdmin: () => mockSupabase,
  };
});

describe("getInstagramShopsFromDb", () => {
  let mockSupabaseClient: {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    neq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    range: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    then: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSupabaseClient = supabaseAdmin() as unknown as typeof mockSupabaseClient;
    vi.clearAllMocks();
  });

  it("successfully retrieves, filters by niche, and maps active IG shops", async () => {
    const mockDbData = [
      {
        id: "1",
        slug: "manto_sara",
        type: "ig_shop",
        name: "مانتو سارا",
        category_slug: "clothing",
        city: null,
        description: "شیک‌ترین مانتوها",
        initial: "م",
        color: "#8B5CF6",
        contact: { instagram: "manto_sara" },
        hours: null,
        info: [],
        claimed: false,
        verified: true,
        status: "active",
        review_count: 5,
        rating_sum: 24,
        rating_avg: 4.8,
        created_at: "2026-05-23T00:00:00Z",
        updated_at: "2026-05-23T00:00:00Z",
      },
    ];

    mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
      Promise.resolve(callback({ data: mockDbData, error: null, count: 1 }))
    );

    const result = await getInstagramShopsFromDb({
      niche: "clothing",
      sort: "rating",
      page: 1,
      limit: 8,
    });

    expect(mockSupabaseClient.from).toHaveBeenCalledWith("businesses");
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith("type", "ig_shop");
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith("category_slug", "clothing");
    expect(result.shops).toHaveLength(1);
    expect(result.shops[0].name).toBe("مانتو سارا");
    expect(result.shops[0].handle).toBe("@manto_sara");
    expect(result.shops[0].score).toBe("۴٫۸"); // Farsi formatting
    expect(result.shops[0].reviews).toBe("۵"); // Farsi formatting
    expect(result.total).toBe(1);
  });

  it("returns empty list if query fails", async () => {
    mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
      Promise.resolve(callback({ data: null, error: new Error("Query Error"), count: 0 }))
    );

    const result = await getInstagramShopsFromDb();
    expect(result.shops).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe("getShopByHandle", () => {
  let mockSupabaseClient: {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    neq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    range: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    then: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSupabaseClient = supabaseAdmin() as unknown as typeof mockSupabaseClient;
    vi.clearAllMocks();
  });

  it("returns undefined if shop handle does not exist", async () => {
    mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
      Promise.resolve(callback({ data: null, error: new Error("Not Found") }))
    );

    const shop = await getShopByHandle("nonexistent");
    expect(shop).toBeUndefined();
  });

  it("retrieves individual shop profile with mapped reviews", async () => {
    const mockShopData = {
      id: "shop-id-1",
      slug: "arezoo_cake",
      type: "ig_shop",
      name: "کیک خونگی آرزو",
      category_slug: "food",
      city: null,
      description: "لذیذترین کیک‌های خانگی",
      initial: "ک",
      color: "#F59E0B",
      contact: { instagram: "arezoo_cake" },
      hours: null,
      info: [],
      claimed: false,
      verified: true,
      status: "active",
      review_count: 1,
      rating_sum: 5,
      rating_avg: 5.0,
      created_at: "2026-05-23T00:00:00Z",
      updated_at: "2026-05-23T00:00:00Z",
    };

    const mockReviewsData = [
      {
        id: "rev-1",
        rating: 5,
        created_at: "2026-05-23T01:00:00Z",
        body: "بهترین کیک شکلاتی کل ایران را دارند!",
        verified: true,
        author: {
          id: "user-1",
          display_name: "مریم احمدی",
          avatar_color: "#EC4899",
        },
      },
    ];

    // Mock first call for businesses detail, then second for reviews, then third for similar shops
    let callIndex = 0;
    mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) => {
      callIndex++;
      if (callIndex === 1) {
        return Promise.resolve(callback({ data: mockShopData, error: null }));
      } else if (callIndex === 2) {
        return Promise.resolve(callback({ data: mockReviewsData, error: null }));
      } else {
        return Promise.resolve(callback({ data: [], error: null }));
      }
    });

    const shop = await getShopByHandle("arezoo_cake");
    expect(shop).toBeDefined();
    expect(shop?.name).toBe("کیک خونگی آرزو");
    expect(shop?.reviews).toHaveLength(1);
    expect(shop?.reviews[0].user.name).toBe("مریم احمدی");
    expect(shop?.reviews[0].rating).toBe(5);
  });
});
