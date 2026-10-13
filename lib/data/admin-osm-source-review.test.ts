import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: () => ({ from: mocks.from }),
}));

import { recordAdminOsmSourceReviewDecision } from "./admin-osm-source-review";

const sourceId = "10000000-0000-4000-8000-000000000001";

function chain(finalMethod: "maybeSingle" | "single", result: unknown) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "like", "order", "limit", "insert"]) {
    query[method] = vi.fn(() => query);
  }
  query[finalMethod] = vi.fn().mockResolvedValue(result);
  return query;
}

function eligibleSourceRow() {
  return {
    id: sourceId,
    source_type: "open_dataset",
    source_ref: "https://www.openstreetmap.org/node/101",
    permission_basis: "open_license",
    license_name: "ODbL-1.0",
    license_url: "https://www.openstreetmap.org/copyright",
    attribution_text: "© OpenStreetMap contributors",
    field_payload: {
      contact: { phone: "+981333112233", address: "رشت، گلسار" },
    },
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

describe("recordAdminOsmSourceReviewDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1", role: "admin" });
  });

  it("does not touch the database when authorization fails", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("unauthorized"));

    await expect(
      recordAdminOsmSourceReviewDecision({
        sourceId,
        decision: "ready_for_approval",
        note: "",
      }),
    ).rejects.toThrow("unauthorized");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("validates the decision before opening the service-role client", async () => {
    await expect(
      recordAdminOsmSourceReviewDecision({
        sourceId,
        decision: "rejected",
        note: "",
      }),
    ).resolves.toEqual({
      ok: false,
      error: "برای این تصمیم توضیح لازم است.",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("appends a trusted criteria snapshot without updating publication state", async () => {
    const sourceQuery = chain("maybeSingle", {
      data: eligibleSourceRow(),
      error: null,
    });
    const latestQuery = chain("maybeSingle", { data: null, error: null });
    const insertedEvent = {
      id: "30000000-0000-4000-8000-000000000001",
      source_id: sourceId,
      decision: "ready_for_approval",
      note: null,
      criteria_snapshot: {
        has_phone: true,
        has_address: true,
        has_website: false,
        has_instagram: false,
        valid_source_links: true,
        prescreen: {
          version: "nazarato-osm-prescreen/0.1.0",
          recommendation: "low_risk_review",
          score: 90,
          reason_codes: [
            "valid_provenance",
            "rasht_coordinates",
            "phone_present",
            "address_present",
            "missing_digital_channel",
          ],
        },
      },
      created_at: "2026-09-05T10:00:00.000Z",
    };
    const insertQuery = chain("single", {
      data: insertedEvent,
      error: null,
    });
    let eventCalls = 0;
    mocks.from.mockImplementation((table: string) => {
      if (table === "business_sources") return sourceQuery;
      eventCalls += 1;
      return eventCalls === 1 ? latestQuery : insertQuery;
    });

    await expect(
      recordAdminOsmSourceReviewDecision({
        sourceId,
        decision: "ready_for_approval",
        note: "",
      }),
    ).resolves.toMatchObject({ ok: true, noAction: false });

    expect(insertQuery.insert).toHaveBeenCalledWith({
      source_id: sourceId,
      reviewer_id: "admin-1",
      decision: "ready_for_approval",
      note: null,
      criteria_snapshot: insertedEvent.criteria_snapshot,
    });
    expect(sourceQuery).not.toHaveProperty("update");
  });

  it("treats an identical latest decision as a no-op", async () => {
    const sourceQuery = chain("maybeSingle", {
      data: eligibleSourceRow(),
      error: null,
    });
    const latestQuery = chain("maybeSingle", {
      data: { decision: "ready_for_approval", note: null },
      error: null,
    });
    mocks.from
      .mockReturnValueOnce(sourceQuery)
      .mockReturnValueOnce(latestQuery);

    await expect(
      recordAdminOsmSourceReviewDecision({
        sourceId,
        decision: "ready_for_approval",
        note: "",
      }),
    ).resolves.toEqual({ ok: true, noAction: true });
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });
});
