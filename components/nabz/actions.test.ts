import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  supabaseAdmin: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: mocks.supabaseAdmin,
}));

import { saveTasteProfile } from "./actions";

describe("saveTasteProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.supabaseAdmin.mockReturnValue({ from: mocks.from });
    mocks.from.mockReturnValue({ upsert: mocks.upsert });
    mocks.upsert.mockResolvedValue({ error: null });
  });

  it("does not touch the profile store for an anonymous visitor", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await saveTasteProfile({
      scenarioId: "date",
      selectedPlaceIds: ["baran", "toranj"],
    });

    expect(result).toEqual(
      expect.objectContaining({ ok: false, reason: "unauthenticated" }),
    );
    expect(mocks.supabaseAdmin).not.toHaveBeenCalled();
  });

  it("rebuilds scores server-side and upserts a versioned private profile", async () => {
    mocks.getSession.mockResolvedValue({
      id: "user-1",
      name: "کاربر تست",
      phone: "+989121234567",
    });

    const result = await saveTasteProfile({
      scenarioId: "date",
      selectedPlaceIds: ["baran", "toranj", "kaghaz"],
    });

    expect(result).toEqual({ ok: true, evidenceCount: 3 });
    expect(mocks.from).toHaveBeenCalledWith("taste_profiles");
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        model_id: "nazarato-taste-graph",
        model_version: "0.1.0",
        evidence_count: 3,
        is_active: true,
        dimension_weights: expect.objectContaining({ cozy: expect.any(Number) }),
      }),
      { onConflict: "user_id,model_id,model_version" },
    );
  });

  it("rejects forged scores and surfaces a bounded database failure", async () => {
    mocks.getSession.mockResolvedValue({ id: "user-1", name: "کاربر تست", phone: "+989121234567" });

    const invalid = await saveTasteProfile({
      scenarioId: "date",
      selectedPlaceIds: ["baran"],
      scores: { cozy: 9_999 },
    });
    expect(invalid).toEqual(expect.objectContaining({ ok: false, reason: "invalid" }));
    expect(mocks.supabaseAdmin).not.toHaveBeenCalled();

    mocks.upsert.mockResolvedValue({ error: { message: "table unavailable" } });
    const unavailable = await saveTasteProfile({
      scenarioId: "date",
      selectedPlaceIds: ["baran"],
    });
    expect(unavailable).toEqual(
      expect.objectContaining({ ok: false, reason: "unavailable" }),
    );
  });
});
