import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  like: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: () => ({
    rpc: mocks.rpc,
    from: mocks.from,
    select: mocks.select,
    eq: mocks.eq,
    like: mocks.like,
  }),
}));

import {
  approveAdminOsmPublication,
  countAdminPublishedOsmSources,
} from "./admin-osm-publication";

const sourceId = "10000000-0000-4000-8000-000000000001";
const businessId = "20000000-0000-4000-8000-000000000001";
const eventId = "30000000-0000-4000-8000-000000000001";

describe("admin OSM publication data boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1", role: "admin" });
    mocks.from.mockReturnThis();
    mocks.select.mockReturnThis();
    mocks.eq.mockReturnThis();
    mocks.like.mockResolvedValue({ count: 3, error: null });
  });

  it("validates before invoking the single atomic publication RPC", async () => {
    mocks.rpc.mockResolvedValue({
      data: { noAction: false, sourceId, businessId, eventId },
      error: null,
    });

    await expect(
      approveAdminOsmPublication({
        sourceId,
        confirmationSlug: "rasht-osm-node-101",
        identityConfirmed: true,
        scopeConfirmed: true,
        attributionConfirmed: true,
      }),
    ).resolves.toEqual({
      ok: true,
      noAction: false,
      sourceId,
      businessId,
      eventId,
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "approve_osm_business_source_for_publication",
      {
        p_source_id: sourceId,
        p_reviewer_id: "admin-1",
        p_confirmation_slug: "rasht-osm-node-101",
      },
    );
  });

  it("does not open the service-role mutation for invalid input", async () => {
    await expect(
      approveAdminOsmPublication({
        sourceId,
        confirmationSlug: "wrong-business",
        identityConfirmed: true,
        scopeConfirmed: true,
        attributionConfirmed: true,
      }),
    ).resolves.toEqual({
      ok: false,
      error: "شناسه تأیید با قالب رکورد OSM مطابقت ندارد.",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns a bounded error instead of leaking database details", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "55000", message: "internal invariant detail" },
    });
    await expect(
      approveAdminOsmPublication({
        sourceId,
        confirmationSlug: "rasht-osm-node-101",
        identityConfirmed: true,
        scopeConfirmed: true,
        attributionConfirmed: true,
      }),
    ).resolves.toEqual({
      ok: false,
      error: "این رکورد دیگر شرایط انتشار را ندارد؛ صفحه را تازه کن و دوباره بررسی کن.",
    });
  });

  it("counts only active Rasht businesses with approved open provenance", async () => {
    await expect(countAdminPublishedOsmSources()).resolves.toBe(3);
    expect(mocks.from).toHaveBeenCalledWith("business_sources");
    expect(mocks.eq).toHaveBeenCalledWith("status", "approved");
    expect(mocks.eq).toHaveBeenCalledWith("businesses.status", "active");
    expect(mocks.eq).toHaveBeenCalledWith("businesses.city", "رشت");
  });
});
