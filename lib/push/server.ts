import webpush from "web-push";
import { listSubscriptions, removeSubscription } from "./store";
import { parseSubscription } from "./subscription";

export type PushPayload = { title: string; body?: string; link?: string; tag?: string };
export type PushResult = { accepted: number; failed: number; unavailable: boolean };

export function pushConfiguration() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  return publicKey && privateKey && subject ? { publicKey, privateKey, subject } : null;
}

/** Exercise Worker signing/encryption locally; this never dispatches a message. */
export function pushRuntimeReady(): boolean {
  const vapidDetails = pushConfiguration();
  if (!vapidDetails) return false;
  try {
    webpush.generateRequestDetails({
      endpoint: "https://fcm.googleapis.com/fcm/send/configuration-check",
      keys: { p256dh: vapidDetails.publicKey, auth: Buffer.alloc(16).toString("base64url") },
    }, "configuration check", { vapidDetails, TTL: 0 });
    return true;
  } catch {
    console.error("[push] runtime configuration check failed");
    return false;
  }
}

/** Provider acceptance is reported separately from actual device display. */
export async function sendPushToUser(userId: string, payload: PushPayload, endpoint?: string): Promise<PushResult> {
  const result: PushResult = { accepted: 0, failed: 0, unavailable: false };
  const vapidDetails = pushConfiguration();
  if (!vapidDetails) return { ...result, unavailable: true };
  try {
    const subscriptions = (await listSubscriptions(userId)).filter((s) => !endpoint || s.endpoint === endpoint);
    await Promise.all(subscriptions.map(async (stored) => {
      const sub = parseSubscription({ endpoint: stored.endpoint, keys: { p256dh: stored.p256dh, auth: stored.auth } });
      if (!sub) { result.failed++; return; }
      try {
        // web-push handles encryption/VAPID; native fetch is supported by Workers.
        const request = webpush.generateRequestDetails(sub, JSON.stringify(payload), { vapidDetails, TTL: 60 });
        const response = await fetch(request.endpoint, {
          method: request.method,
          headers: request.headers as Record<string, string>,
          body: request.body ? new Uint8Array(request.body).buffer : undefined,
          signal: AbortSignal.timeout(10_000),
          // Never forward credentials/body across a redirect; workerd supports manual.
          redirect: "manual",
        });
        if (response.ok) result.accepted++;
        else {
          result.failed++;
          if (response.status === 404 || response.status === 410) await removeSubscription(userId, sub.endpoint);
          console.error("[push] provider rejected delivery", { userId, status: response.status });
        }
        await response.body?.cancel();
      } catch (error) {
        result.failed++;
        console.error("[push] delivery failed", { userId, errorType: error instanceof Error ? error.name : "unknown" });
      }
    }));
  } catch (error) {
    result.unavailable = true;
    console.error("[push] subscription lookup failed", { userId, errorType: error instanceof Error ? error.name : "unknown" });
  }
  return result;
}

/** Delivery errors never break review/moderation actions. */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  await Promise.all(userIds.map((id) => sendPushToUser(id, payload)));
}
