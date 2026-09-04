import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  like: vi.fn(),
  order: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: () => ({
    from: mocks.from,
    select: mocks.select,
    eq: mocks.eq,
    like: mocks.like,
    order: mocks.order,
  }),
}));

import { listAdminOsmReviewCandidates } from "./admin-osm-review";

describe("listAdminOsmReviewCandidates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1", role: "admin" });
    mocks.from.mockReturnThis();
    mocks.select.mockReturnThis();
    mocks.eq.mockReturnThis();
    mocks.like.mockReturnThis();
    mocks.order.mockResolvedValue({ data: [], error: null });
  });

  it("re-authorizes and limits the service-role query to the quarantine contract", async () => {
    await expect(listAdminOsmReviewCandidates()).resolves.toEqual([]);

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.from).toHaveBeenCalledWith("business_sources");
    expect(mocks.eq).toHaveBeenCalledWith("source_type", "open_dataset");
    expect(mocks.eq).toHaveBeenCalledWith("permission_basis", "open_license");
    expect(mocks.eq).toHaveBeenCalledWith("status", "quarantined");
    expect(mocks.eq).toHaveBeenCalledWith("businesses.status", "pending");
    expect(mocks.eq).toHaveBeenCalledWith("businesses.city", "رشت");
    expect(mocks.like).toHaveBeenCalledWith(
      "source_ref",
      "https://www.openstreetmap.org/%",
    );
  });

  it("does not access the service-role database when admin authorization fails", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("unauthorized"));

    await expect(listAdminOsmReviewCandidates()).rejects.toThrow("unauthorized");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
