import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  notifyAdminsOfNewReview: vi.fn(),
  persistReviewAnalysisBestEffort: vi.fn(),
  supabaseAdmin: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/data/notifications", () => ({
  notifyAdminsOfNewReview: mocks.notifyAdminsOfNewReview,
}));

vi.mock("@/lib/data/review-analysis-persistence", () => ({
  persistReviewAnalysisBestEffort: mocks.persistReviewAnalysisBestEffort,
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: mocks.supabaseAdmin,
}));

import { submitQuickReview } from "./actions";

function formData(): FormData {
  const data = new FormData();
  data.set("slug", "cafe-test");
  data.set("rating", "5");
  data.set("body", "قهوه خوشمزه بود و فضای کافه خیلی دنج و تمیز بود.");
  return data;
}

describe("submitQuickReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ id: "user-1" });
    mocks.notifyAdminsOfNewReview.mockResolvedValue(undefined);
    mocks.persistReviewAnalysisBestEffort.mockResolvedValue(true);
    mocks.supabaseAdmin.mockReturnValue({ from: mocks.from });
    mocks.from.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "business-1", name: "کافه تست" },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "reviews") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: { id: "review-1" },
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it("persists the versioned voice analysis after a review is created", async () => {
    const result = await submitQuickReview({ ok: false }, formData());

    expect(result).toEqual({ ok: true });
    expect(mocks.persistReviewAnalysisBestEffort).toHaveBeenCalledWith(
      "review-1",
      "قهوه خوشمزه بود و فضای کافه خیلی دنج و تمیز بود.",
    );
    expect(mocks.notifyAdminsOfNewReview).toHaveBeenCalledWith({
      businessName: "کافه تست",
    });
  });

  it("does not block review submission when optional analysis persistence fails", async () => {
    mocks.persistReviewAnalysisBestEffort.mockResolvedValue(false);

    const result = await submitQuickReview({ ok: false }, formData());

    expect(result).toEqual({ ok: true });
    expect(mocks.notifyAdminsOfNewReview).toHaveBeenCalledTimes(1);
  });
});
