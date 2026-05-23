import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBookmarkStatus, getUserBookmarks, getPopularBusinesses } from "./bookmarks";
import { supabaseAdmin } from "@/lib/supabase/server";

// Mock the server file that returns the supabaseAdmin client
vi.mock("@/lib/supabase/server", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    then: vi.fn(), // to allow awaiting the query
  };
  return {
    supabaseAdmin: () => mockSupabase,
  };
});

describe("Bookmarks Data Layer", () => {
  let mockSupabaseClient: {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    not: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    then: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSupabaseClient = supabaseAdmin() as unknown as typeof mockSupabaseClient;
    vi.clearAllMocks();
  });

  describe("getBookmarkStatus", () => {
    it("returns true if bookmark exists", async () => {
      mockSupabaseClient.then
        .mockImplementationOnce((cb) => Promise.resolve(cb({ data: { id: "biz-1" }, error: null })))
        .mockImplementationOnce((cb) => Promise.resolve(cb({ data: { id: "some-id" }, error: null })));

      const status = await getBookmarkStatus("user-1", "biz-slug");

      expect(status).toBe(true);
    });

    it("returns false if bookmark does not exist", async () => {
      mockSupabaseClient.then
        .mockImplementationOnce((cb) => Promise.resolve(cb({ data: { id: "biz-1" }, error: null })))
        .mockImplementationOnce((cb) => Promise.resolve(cb({ data: null, error: null })));

      const status = await getBookmarkStatus("user-1", "biz-slug");
      expect(status).toBe(false);
    });

    it("returns false on error", async () => {
      mockSupabaseClient.then
        .mockImplementationOnce((cb) => Promise.resolve(cb({ data: { id: "biz-1" }, error: null })))
        .mockImplementationOnce((cb) => Promise.resolve(cb({ data: null, error: new Error("DB error") })));

      const status = await getBookmarkStatus("user-1", "biz-slug");
      expect(status).toBe(false);
    });
  });

  describe("getUserBookmarks", () => {
    it("fetches and maps bookmarks correctly", async () => {
      const mockData = [
        {
          created_at: "2026-05-23T00:00:00.000Z",
          business: {
            slug: "digikala",
            name: "دیجی‌کالا",
            category_slug: "digital",
            city: "تهران",
            initial: "د",
            color: "#EF4444",
            rating_avg: 4.2,
            review_count: 5,
            verified: true,
            type: "company",
          },
        },
      ];

      mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
        Promise.resolve(callback({ data: mockData, error: null }))
      );

      const bookmarks = await getUserBookmarks("user-1");

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("bookmarks");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].name).toBe("دیجی‌کالا");
      expect(bookmarks[0].score).toBe("۴٫۲");
    });

    it("filters by type if type is provided", async () => {
      const mockData = [
        {
          business: {
            slug: "some-shop",
            name: "فروشگاه ۱",
            type: "ig_shop",
            category_slug: "digital",
            rating_avg: 0,
            review_count: 0,
          },
        },
      ];

      mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
        Promise.resolve(callback({ data: mockData, error: null }))
      );

      await getUserBookmarks("user-1", "ig_shop");

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("businesses.type", "ig_shop");
      expect(mockSupabaseClient.not).toHaveBeenCalledWith("businesses", "is", null);
    });

    it("returns empty array on db error", async () => {
      mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
        Promise.resolve(callback({ data: null, error: new Error("DB error") }))
      );

      const bookmarks = await getUserBookmarks("user-1");
      expect(bookmarks).toEqual([]);
    });
  });

  describe("getPopularBusinesses", () => {
    it("fetches top 4 popular businesses", async () => {
      const mockData = [
        {
          slug: "pop-1",
          name: "کسب و کار محبوب",
          category_slug: "food",
          rating_avg: 4.8,
          review_count: 100,
        },
      ];

      mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
        Promise.resolve(callback({ data: mockData, error: null }))
      );

      const businesses = await getPopularBusinesses();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("businesses");
      expect(mockSupabaseClient.order).toHaveBeenCalledWith("review_count", { ascending: false });
      expect(mockSupabaseClient.order).toHaveBeenCalledWith("rating_avg", { ascending: false });
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(4);
      expect(businesses).toHaveLength(1);
      expect(businesses[0].name).toBe("کسب و کار محبوب");
      expect(businesses[0].reviews).toBe("۱۰۰");
    });
  });
});
