import { createECDH, randomBytes } from "node:crypto";
import webpush from "web-push";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const store = vi.hoisted(() => ({ listSubscriptions: vi.fn(), removeSubscription: vi.fn() }));
vi.mock("./store", () => store);
import { pushRuntimeReady, sendPushToUser } from "./server";

const key = createECDH("prime256v1"); key.generateKeys();
const sub = { endpoint: "https://fcm.googleapis.com/fcm/send/local-test", p256dh: key.getPublicKey().toString("base64url"), auth: randomBytes(16).toString("base64url") };
beforeEach(() => {
  const vapid = webpush.generateVAPIDKeys();
  vi.stubEnv("VAPID_PUBLIC_KEY", vapid.publicKey); vi.stubEnv("VAPID_PRIVATE_KEY", vapid.privateKey);
  vi.stubEnv("VAPID_SUBJECT", "https://staging.nazarato.ir");
  store.listSubscriptions.mockResolvedValue([sub]);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
it("checks signing/encryption without dispatching and rejects invalid keys", () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  expect(pushRuntimeReady()).toBe(true);
  vi.stubEnv("VAPID_PRIVATE_KEY", "invalid");
  expect(pushRuntimeReady()).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
});
it("encrypts for the selected owned device and reports provider acceptance", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 201 })); vi.stubGlobal("fetch", fetcher);
  expect(await sendPushToUser("alice", { title: "local test" }, sub.endpoint)).toEqual({ accepted: 1, failed: 0, unavailable: false });
  expect(store.listSubscriptions).toHaveBeenCalledWith("alice");
  expect(fetcher.mock.calls[0][1].body).toBeInstanceOf(ArrayBuffer);
  expect(fetcher.mock.calls[0][1].redirect).toBe("manual");
});
it("rejects redirects without dispatching the encrypted notification to another host", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 307, headers: { location: "https://untrusted.invalid/" } }));
  vi.stubGlobal("fetch", fetcher);
  expect(await sendPushToUser("alice", { title: "test" })).toEqual({ accepted: 0, failed: 1, unavailable: false });
  expect(fetcher).toHaveBeenCalledOnce();
  expect(fetcher.mock.calls[0][1].redirect).toBe("manual");
  expect(store.removeSubscription).not.toHaveBeenCalled();
});
it("prunes a gone endpoint only for its owner and never reports success", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 410 })));
  expect((await sendPushToUser("alice", { title: "test" })).accepted).toBe(0);
  expect(store.removeSubscription).toHaveBeenCalledWith("alice", sub.endpoint);
});
it("cannot send to an unowned or untrusted endpoint", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  expect((await sendPushToUser("alice", { title: "test" }, "https://fcm.googleapis.com/fcm/send/bob")).accepted).toBe(0);
  store.listSubscriptions.mockResolvedValue([{ ...sub, endpoint: "https://localhost/private" }]);
  expect((await sendPushToUser("alice", { title: "test" })).failed).toBe(1);
  expect(fetcher).not.toHaveBeenCalled();
});
