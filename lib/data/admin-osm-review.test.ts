import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  like: vi.fn(),
  order: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: () => ({
    from: mocks.from,
    select: mocks.select,
    eq: mocks.eq,
    in: mocks.in,
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
    mocks.in.mockReturnThis();
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

  it("attaches quarantined factual proposals separately from OSM fields and score", async () => {
    const businessId = "20000000-0000-4000-8000-000000000001";
    const sourceId = "10000000-0000-4000-8000-000000000001";
    mocks.order
      .mockReset()
      .mockResolvedValueOnce({
        data: [
          {
            id: sourceId,
            source_type: "open_dataset",
            source_ref: "https://www.openstreetmap.org/node/101",
            permission_basis: "open_license",
            license_name: "ODbL-1.0",
            license_url: "https://www.openstreetmap.org/copyright",
            attribution_text: "© OpenStreetMap contributors",
            field_payload: { contact: {} },
            captured_at: "2026-09-02T19:07:36.000Z",
            status: "quarantined",
            businesses: {
              id: businessId,
              name: "کافه باران",
              slug: "rasht-osm-node-101",
              category_slug: "cafe",
              city: "رشت",
              status: "pending",
              latitude: 37.28,
              longitude: 49.58,
            },
          },
        ],
        error: null,
      })
      .mockImplementationOnce(function (this: unknown) {
        return this;
      })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({
        data: [
          {
            id: "30000000-0000-4000-8000-000000000001",
            business_id: businessId,
            source_type: "manual_public_facts",
            source_ref: "https://sayebookcafe.com/contact",
            permission_basis: "public_factual_contact",
            field_payload: { contact: { phone: "+981333112233" } },
            captured_at: "2026-09-05T10:00:00.000Z",
            status: "quarantined",
            created_by: "40000000-0000-4000-8000-000000000001",
          },
        ],
        error: null,
      });

    const [candidate] = await listAdminOsmReviewCandidates();

    expect(candidate.contact).toEqual({});
    expect(candidate.completenessScore).toBe(0);
    expect(candidate.completionProposals).toHaveLength(1);
    expect(candidate.completionProposals[0].contact).toEqual({
      phone: "+981333112233",
    });
    expect(mocks.eq).toHaveBeenCalledWith(
      "source_type",
      "manual_public_facts",
    );
    expect(mocks.eq).toHaveBeenCalledWith("status", "quarantined");
    expect(mocks.in).toHaveBeenCalledWith("business_id", [businessId]);
  });
});
