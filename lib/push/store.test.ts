import { afterEach, expect, it, vi } from "vitest";
import { testDatabase } from "../staging/test-database";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), database: vi.fn() }));
vi.mock("../supabase/server", () => ({ supabaseAdmin: mocks.admin }));
vi.mock("../staging/database", () => ({ stagingDatabase: mocks.database }));
import { listSubscriptions, removeSubscription, saveSubscription } from "./store";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it("keeps staging subscriptions isolated and prevents cross-account takeover/deletion", async () => {
  vi.stubEnv("NAZARATO_DEPLOYMENT_ENV", "staging");
  const db = testDatabase(); mocks.database.mockResolvedValue(db);
  try {
    const sub = { endpoint: "https://fcm.googleapis.com/fcm/send/test", keys: { p256dh: "public", auth: "auth" } };
    expect(await saveSubscription("alice", sub, "test")).toBe(true);
    expect(await saveSubscription("bob", sub, "test")).toBe(false);
    await removeSubscription("bob", sub.endpoint);
    expect((await listSubscriptions("alice")).length).toBe(1);
    expect(await listSubscriptions("bob")).toEqual([]);
    await removeSubscription("alice", sub.endpoint);
    expect(await listSubscriptions("alice")).toEqual([]);
    expect(mocks.admin).not.toHaveBeenCalled();
  } finally { db.close(); }
});
