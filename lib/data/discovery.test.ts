import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ local: vi.fn(), db: vi.fn() }));
vi.mock("@/lib/preview/golsar-server", () => ({ getLocalGolsarCafes: mocks.local }));
vi.mock("@/lib/supabase/server", () => ({ supabaseAdmin: mocks.db }));
import { getDiscoveryCatalog, mapDiscoveryRow } from "./discovery";
const row = { slug: "real-cafe", name: "کافه محلی", type: "company", category_slug: "food", city: "رشت", color: "#123456", verified: false, review_count: 0, rating_avg: null, info: [{ label: "نشانی", value: "بلوار توحید" }, { label: "private-note", value: "not public" }] };
beforeEach(() => { vi.clearAllMocks(); mocks.local.mockResolvedValue(null); });
describe("public discovery supply", () => {
  it("projects public address, category and real review state", () => {
    expect(mapDiscoveryRow(row)).toEqual({ business: expect.objectContaining({ slug: "real-cafe", category: "کافه", city: "رشت", score: "—", verified: false, searchText: "بلوار توحید" }) });
  });
  it("rejects unsafe identities, unknown types and unsupported shops", () => {
    for (const patch of [{ slug: "../private" }, { slug: "x".repeat(161) }, { type: "unknown" }, { type: "ig_shop", category_slug: "unrecognized" }]) expect(mapDiscoveryRow({ ...row, ...patch })).toBeNull();
  });
  it("keeps an unverified shop unverified", () => {
    expect(mapDiscoveryRow({ ...row, type: "ig_shop", category_slug: "food" })).toEqual({ shop: expect.objectContaining({ href: "/shop/real-cafe", verified: false }) });
  });
  function setup(data: unknown, error: { code: string } | null = null) {
    const query = { from: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data, error }) };
    mocks.db.mockReturnValue(query); return query;
  }
  it("requires approved sources and eligible status and maps valid rows only", async () => {
    const query = setup([row, { ...row, slug: "bad/path" }]);
    const catalog = await getDiscoveryCatalog();
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining("business_sources!inner"));
    expect(query.in).toHaveBeenCalledWith("status", ["active", "merged"]);
    expect(query.eq).toHaveBeenCalledWith("business_sources.status", "approved");
    expect(catalog.businesses).toHaveLength(1);
    expect(catalog.local).toBe(false);
  });
  it("keeps a failed read empty without reverting to local or sample data", async () => {
    setup(null, { code: "PGRST" });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try { expect((await getDiscoveryCatalog()).businesses).toEqual([]); }
    finally { log.mockRestore(); }
  });
  it("does not query the public database when the local adapter is explicitly active", async () => {
    mocks.local.mockResolvedValue([]);
    expect(await getDiscoveryCatalog()).toEqual({ businesses: [], shops: [], local: true });
    expect(mocks.db).not.toHaveBeenCalled();
  });
});
