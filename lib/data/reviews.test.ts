import { describe, it, expect, vi, beforeEach } from "vitest";
import { getReviewsFromDb } from "./reviews";
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

describe("getReviewsFromDb", () => {
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

  it("successfully retrieves, filters, and maps reviews", async () => {
    const mockDbData = [
      {
        id: "rev-id-123",
        rating: 5,
        created_at: "2026-05-23T12:00:00Z",
        body: "کیفیت بسیار عالی داشت و در اسرع وقت ارسال شد.",
        verified: true,
        helpful_count: 10,
        report_count: 0,
        author: {
          id: "user-id-abc",
          display_name: "امین علوی",
          avatar_color: "#10B981",
        },
        business: {
          id: "biz-id-xyz",
          name: "دیجی‌کالا",
          slug: "digikala",
          type: "company",
          category_slug: "digital",
        },
      },
    ];

    mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
      Promise.resolve(callback({ data: mockDbData, error: null, count: 1 }))
    );

    const result = await getReviewsFromDb({
      rating: 5,
      categorySlug: "digital",
      igOnly: false,
      sort: "newest",
      page: 1,
      limit: 6,
    });

    expect(mockSupabaseClient.from).toHaveBeenCalledWith("reviews");
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith("status", "published");
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith("rating", 5);
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith("business.category_slug", "digital");
    expect(mockSupabaseClient.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 5);

    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0].id).toBe("rev-id-123");
    expect(result.reviews[0].user.name).toBe("امین علوی");
    expect(result.reviews[0].user.initial).toBe("ا");
    expect(result.reviews[0].user.color).toBe("#10B981");
    expect(result.reviews[0].shop.name).toBe("دیجی‌کالا");
    expect(result.reviews[0].shop.href).toBe("/company/digikala");
    expect(result.reviews[0].rating).toBe(5);
    expect(result.reviews[0].verified).toBe(true);
    expect(result.total).toBe(1);
  });

  it("filters by ig_shop type and maps correct shop href", async () => {
    const mockDbData = [
      {
        id: "rev-id-ig",
        rating: 4,
        created_at: "2026-05-23T11:00:00Z",
        body: "لباس‌های زیبایی دارند، خرید آسانی بود.",
        verified: false,
        helpful_count: 2,
        report_count: 0,
        author: {
          id: "user-id-def",
          display_name: "مریم گلی",
          avatar_color: null,
        },
        business: {
          id: "biz-id-ig",
          name: "مانتو سارا",
          slug: "manto_sara",
          type: "ig_shop",
          category_slug: "clothing",
        },
      },
    ];

    mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
      Promise.resolve(callback({ data: mockDbData, error: null, count: 1 }))
    );

    const result = await getReviewsFromDb({
      igOnly: true,
      sort: "helpful",
    });

    expect(mockSupabaseClient.eq).toHaveBeenCalledWith("business.type", "ig_shop");
    expect(mockSupabaseClient.order).toHaveBeenCalledWith("helpful_count", { ascending: false });
    
    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0].shop.href).toBe("/shop/manto_sara");
  });

  it("returns empty array if query fails", async () => {
    mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
      Promise.resolve(callback({ data: null, error: new Error("DB Query Error"), count: 0 }))
    );

    const result = await getReviewsFromDb();
    expect(result.reviews).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
