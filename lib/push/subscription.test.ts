import { describe, expect, it } from "vitest";
import { parseSubscription, isPushEndpoint } from "./subscription";
const keys = { p256dh: Buffer.concat([Buffer.from([4]), Buffer.alloc(64, 1)]).toString("base64url"), auth: Buffer.alloc(16, 2).toString("base64url") };
describe("push subscription boundary", () => {
  it("accepts supported HTTPS push endpoints with valid key lengths", () => {
    for (const endpoint of ["https://fcm.googleapis.com/fcm/send/test", "https://updates.push.services.mozilla.com/wpush/v2/test", "https://web.push.apple.com/test"]) {
      expect(parseSubscription({ endpoint, keys })).toEqual({ endpoint, keys });
    }
  });
  it("rejects arbitrary destinations, credentials, redirects and malformed keys", () => {
    for (const endpoint of ["http://fcm.googleapis.com/test", "https://127.0.0.1/test", "https://fcm.googleapis.com.evil.test/test", "https://user@fcm.googleapis.com/test", "https://fcm.googleapis.com:8443/test", "https://example.com/test"]) expect(isPushEndpoint(endpoint)).toBe(false);
    expect(parseSubscription({ endpoint: "https://fcm.googleapis.com/test", keys: { ...keys, auth: "bad" } })).toBeNull();
    expect(parseSubscription(null)).toBeNull();
  });
});
