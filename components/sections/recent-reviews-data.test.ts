import { describe, expect, it, vi } from "vitest";
import { loadHomepageReviews } from "./recent-reviews-data";

describe("loadHomepageReviews", () => {
  it("returns database reviews when they are available", async () => {
    const databaseReview = { id: "database-review", text: "تجربه خوبی بود." };

    const result = await loadHomepageReviews({
      getViewer: async () => ({ id: "viewer-1" }),
      getReviews: async () => ({ reviews: [databaseReview], total: 1 }),
    });

    expect(result).toEqual([databaseReview]);
  });

  it("returns an honest empty result when no approved reviews exist", async () => {
    const result = await loadHomepageReviews({
      getViewer: async () => null,
      getReviews: async () => ({ reviews: [], total: 0 }),
    });

    expect(result).toEqual([]);
  });

  it("fails closed when Supabase configuration is unavailable", async () => {
    const warningSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await loadHomepageReviews({
      getViewer: async () => null,
      getReviews: async () => {
        throw new Error("Supabase env missing");
      },
    });

    expect(result).toEqual([]);
    expect(warningSpy).toHaveBeenCalledWith(
      "[homepage] recent reviews unavailable; hiding the review rail",
      expect.objectContaining({ error: "Supabase env missing" }),
    );
    warningSpy.mockRestore();
  });

  it("rethrows Next.js dynamic-rendering signals instead of masking them", async () => {
    const frameworkError = Object.assign(new Error("Dynamic server usage"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });

    await expect(
      loadHomepageReviews({
        getViewer: async () => {
          throw frameworkError;
        },
        getReviews: async () => ({ reviews: [], total: 0 }),
      }),
    ).rejects.toBe(frameworkError);
  });
});
