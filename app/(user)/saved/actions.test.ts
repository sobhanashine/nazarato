import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleBookmark } from "./actions";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    then: vi.fn(),
  };
  return {
    supabaseAdmin: () => mockSupabase,
  };
});

describe("toggleBookmark server action", () => {
  let mockSupabaseClient: {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    then: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSupabaseClient = supabaseAdmin() as unknown as typeof mockSupabaseClient;
    vi.clearAllMocks();
  });

  it("returns error if not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const result = await toggleBookmark("biz-1");

    expect(result).toEqual({ ok: false, error: "برای ذخیره باید وارد شوید" });
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it("deletes bookmark if it already exists", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1", name: "User", phone: "0912" });

    // First query: lookup business ID
    // Second query: check existing bookmark
    // Third query: delete bookmark
    mockSupabaseClient.then
      .mockImplementationOnce((cb) => Promise.resolve(cb({ data: { id: "biz-1" }, error: null })))
      .mockImplementationOnce((cb) => Promise.resolve(cb({ data: { id: "bk-1" }, error: null })))
      .mockImplementationOnce((cb) => Promise.resolve(cb({ error: null })));

    const result = await toggleBookmark("biz-slug");

    expect(mockSupabaseClient.delete).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, bookmarked: false });
  });

  it("inserts bookmark if it does not exist", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1", name: "User", phone: "0912" });

    // 1: lookup business, 2: check bookmark, 3: insert
    mockSupabaseClient.then
      .mockImplementationOnce((cb) => Promise.resolve(cb({ data: { id: "biz-1" }, error: null })))
      .mockImplementationOnce((cb) => Promise.resolve(cb({ data: null, error: null })))
      .mockImplementationOnce((cb) => Promise.resolve(cb({ error: null })));

    const result = await toggleBookmark("biz-slug");

    expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      business_id: "biz-1",
    });
    expect(result).toEqual({ ok: true, bookmarked: true });
  });

  it("handles db errors gracefully", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1", name: "User", phone: "0912" });

    // 1: lookup business, 2: check bookmark, 3: insert error
    mockSupabaseClient.then
      .mockImplementationOnce((cb) => Promise.resolve(cb({ data: { id: "biz-1" }, error: null })))
      .mockImplementationOnce((cb) => Promise.resolve(cb({ data: null, error: null })))
      .mockImplementationOnce((cb) => Promise.resolve(cb({ error: { message: "db error", code: "500" } })));

    const result = await toggleBookmark("biz-slug");

    expect(result).toEqual({ ok: false, error: "خطایی در ذخیره رخ داد" });
  });

  it("handles unique violation (23505) as success (already inserted by concurrent request)", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1", name: "User", phone: "0912" });

    // 1: lookup business, 2: check bookmark, 3: insert unique violation
    mockSupabaseClient.then
      .mockImplementationOnce((cb) => Promise.resolve(cb({ data: { id: "biz-1" }, error: null })))
      .mockImplementationOnce((cb) => Promise.resolve(cb({ data: null, error: null })))
      .mockImplementationOnce((cb) => Promise.resolve(cb({ error: { message: "duplicate", code: "23505" } })));

    const result = await toggleBookmark("biz-slug");

    expect(result).toEqual({ ok: true, bookmarked: true });
  });
});
