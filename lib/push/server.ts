import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/server";

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body?: string;
  link?: string;
  tag?: string;
};

export type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

async function listUserSubscriptions(
  userId: string
): Promise<StoredSubscription[]> {
  const { data, error } = await supabaseAdmin()
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (error) {
    console.error("[push] listUserSubscriptions failed", {
      userId,
      error: error.message,
    });
    return [];
  }
  return data ?? [];
}

async function deleteSubscription(id: string): Promise<void> {
  await supabaseAdmin().from("push_subscriptions").delete().eq("id", id);
}

/**
 * Send a push to every device subscribed by the given user.
 * Prunes subscriptions that the push service reports as gone (404/410).
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!configure()) {
    return;
  }

  const subs = await listUserSubscriptions(userId);
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
      } catch (err: unknown) {
        const statusCode =
          typeof err === "object" && err && "statusCode" in err
            ? (err as { statusCode: number }).statusCode
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          await deleteSubscription(sub.id);
        } else {
          console.error("[push] sendNotification failed", {
            userId,
            subscriptionId: sub.id,
            statusCode,
          });
        }
      }
    })
  );
}

/** Send a push to many users in parallel. */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  await Promise.all(userIds.map((id) => sendPushToUser(id, payload)));
}
