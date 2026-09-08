import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  notifyAdminsOfNewReview: vi.fn(),
  persistReviewAnalysisBestEffort: vi.fn(),
  supabaseAdmin: vi.fn(),
  from: vi.fn(),
  businessSelect: vi.fn(),
  businessEq: vi.fn(),
  businessIn: vi.fn(),
  businessSingle: vi.fn(),
  reviewInsert: vi.fn(),
  getReviewTargets: vi.fn(),
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

vi.mock("@/lib/data/businesses", () => ({
  getReviewTargets: mocks.getReviewTargets,
  PUBLIC_BUSINESS_SOURCE_GATE_SELECT: "business_sources!inner(status)",
  PUBLIC_BUSINESS_STATUSES: ["active", "merged"],
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: mocks.supabaseAdmin,
}));

import { loadReviewTargets, submitQuickReview } from "./actions";

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
    mocks.getReviewTargets.mockResolvedValue({ ok: true, businesses: [] });
    mocks.supabaseAdmin.mockReturnValue({ from: mocks.from });

    const businessQuery = {
      select: mocks.businessSelect,
      eq: mocks.businessEq,
      in: mocks.businessIn,
      single: mocks.businessSingle,
    };
    mocks.businessSelect.mockReturnValue(businessQuery);
    mocks.businessEq.mockReturnValue(businessQuery);
    mocks.businessIn.mockReturnValue(businessQuery);
    mocks.businessSingle.mockResolvedValue({
      data: { id: "business-1", name: "کافه تست" },
      error: null,
    });
    mocks.reviewInsert.mockReturnValue({
      select: () => ({
        single: async () => ({
          data: { id: "review-1" },
          error: null,
        }),
      }),
    });

    mocks.from.mockImplementation((table: string) => {
      if (table === "businesses") {
        return businessQuery;
      }

      if (table === "reviews") {
        return {
          insert: mocks.reviewInsert,
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

  it("requires a public business with approved provenance before inserting", async () => {
    const result = await submitQuickReview({ ok: false }, formData());

    expect(result).toEqual({ ok: true });
    expect(mocks.businessSelect).toHaveBeenCalledWith(
      expect.stringContaining("business_sources!inner"),
    );
    expect(mocks.businessIn).toHaveBeenCalledWith("status", [
      "active",
      "merged",
    ]);
    expect(mocks.businessEq).toHaveBeenCalledWith(
      "business_sources.status",
      "approved",
    );
  });

  it("rejects an invalid business slug before querying the database", async () => {
    const data = formData();
    data.set("slug", "invalid slug");

    await expect(submitQuickReview({ ok: false }, data)).resolves.toEqual({
      ok: false,
      error: "شناسه کسب‌وکار انتخاب‌شده معتبر نیست.",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("does not insert when the business is no longer reviewable", async () => {
    mocks.businessSingle.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });

    const result = await submitQuickReview({ ok: false }, formData());

    expect(result).toEqual({
      ok: false,
      error: "این کسب‌وکار فعلاً امکان دریافت نظر ندارد.",
    });
    expect(mocks.reviewInsert).not.toHaveBeenCalled();
  });

  it("loads the fresh approved review-target supply", async () => {
    const supply = {
      ok: true as const,
      businesses: [
        {
          slug: "cafe-approved",
          name: "کافه تأییدشده",
          category: "کافه",
          city: "رشت",
          initial: "ک",
          color: "#123456",
        },
      ],
    };
    mocks.getReviewTargets.mockResolvedValue(supply);

    await expect(loadReviewTargets()).resolves.toEqual(supply);
  });

  it("fails target loading closed after an unexpected server error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.getReviewTargets.mockRejectedValue(new Error("offline"));

    await expect(loadReviewTargets()).resolves.toEqual({
      ok: false,
      businesses: [],
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[review-targets] unexpected load failure",
      { error: "offline" },
    );
    consoleError.mockRestore();
  });
});
