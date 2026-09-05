import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: () => ({ from: mocks.from }),
}));

import { recordAdminOsmCompletionProposal } from "./admin-osm-completion";

const sourceId = "10000000-0000-4000-8000-000000000001";

function chain(finalMethod: "maybeSingle" | "single", result: unknown) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "like", "insert"]) {
    query[method] = vi.fn(() => query);
  }
  query[finalMethod] = vi.fn().mockResolvedValue(result);
  return query;
}

function eligibleSourceRow(contact: Record<string, string> = {}) {
  return {
    id: sourceId,
    source_type: "open_dataset",
    source_ref: "https://www.openstreetmap.org/node/101",
    permission_basis: "open_license",
    license_name: "ODbL-1.0",
    license_url: "https://www.openstreetmap.org/copyright",
    attribution_text: "© OpenStreetMap contributors",
    field_payload: { contact },
    captured_at: "2026-09-02T19:07:36.000Z",
    status: "quarantined",
    businesses: {
      id: "20000000-0000-4000-8000-000000000001",
      name: "کافه باران",
      slug: "rasht-osm-node-101",
      category_slug: "cafe",
      city: "رشت",
      status: "pending",
      latitude: 37.28,
      longitude: 49.58,
    },
  };
}

function input() {
  return {
    sourceId,
    sourceRef: "https://sayebookcafe.com/contact",
    permissionBasis: "public_factual_contact",
    contact: { phone: "۰۱۳ ۳۳۱۱ ۲۲۳۳", address: "رشت، گلسار" },
  };
}

describe("recordAdminOsmCompletionProposal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1", role: "admin" });
  });

  it("does not open the service-role database when authorization fails", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("unauthorized"));

    await expect(recordAdminOsmCompletionProposal(input())).rejects.toThrow(
      "unauthorized",
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("inserts a separate quarantined source without mutating the OSM row", async () => {
    const sourceQuery = chain("maybeSingle", {
      data: eligibleSourceRow(),
      error: null,
    });
    const insertQuery = chain("single", {
      data: { id: "30000000-0000-4000-8000-000000000001" },
      error: null,
    });
    mocks.from
      .mockReturnValueOnce(sourceQuery)
      .mockReturnValueOnce(insertQuery);

    await expect(recordAdminOsmCompletionProposal(input())).resolves.toEqual({
      ok: true,
      noAction: false,
    });
    expect(insertQuery.insert).toHaveBeenCalledWith({
      business_id: "20000000-0000-4000-8000-000000000001",
      source_type: "manual_public_facts",
      source_ref: "https://sayebookcafe.com/contact",
      permission_basis: "public_factual_contact",
      license_name: null,
      license_url: null,
      attribution_text: null,
      field_payload: {
        contact: {
          phone: "+981333112233",
          address: "رشت، گلسار",
        },
      },
      payload_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      captured_at: expect.any(String),
      status: "quarantined",
      created_by: "admin-1",
    });
    expect(sourceQuery).not.toHaveProperty("update");
  });

  it("rejects a stale proposal that would overwrite an existing OSM field", async () => {
    const sourceQuery = chain("maybeSingle", {
      data: eligibleSourceRow({ phone: "+981333112200" }),
      error: null,
    });
    mocks.from.mockReturnValueOnce(sourceQuery);

    await expect(recordAdminOsmCompletionProposal(input())).resolves.toEqual({
      ok: false,
      error: "فقط فیلدهایی که هنوز در منبع OSM خالی‌اند قابل پیشنهاد هستند.",
    });
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it("treats the same source-backed proposal as a no-op", async () => {
    const sourceQuery = chain("maybeSingle", {
      data: eligibleSourceRow(),
      error: null,
    });
    const insertQuery = chain("single", {
      data: null,
      error: { code: "23505", message: "duplicate" },
    });
    mocks.from
      .mockReturnValueOnce(sourceQuery)
      .mockReturnValueOnce(insertQuery);

    await expect(recordAdminOsmCompletionProposal(input())).resolves.toEqual({
      ok: true,
      noAction: true,
    });
  });

  it("rejects proposals for rows outside the machine completion queue", async () => {
    const sourceQuery = chain("maybeSingle", {
      data: eligibleSourceRow({
        phone: "+981333112200",
        address: "رشت، گلسار",
        instagram: "cafe_rasht",
      }),
      error: null,
    });
    mocks.from.mockReturnValueOnce(sourceQuery);

    await expect(
      recordAdminOsmCompletionProposal({
        ...input(),
        contact: { website: "https://sayebookcafe.com" },
      }),
    ).resolves.toEqual({
      ok: false,
      error: "این رکورد در صف نیازمند تکمیل نیست.",
    });
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
});
