import { isStaging } from "../auth/login-policy";
import { stagingDatabase } from "../staging/database";
import { supabaseAdmin } from "../supabase/server";
import type { SerializableSubscription } from "./subscription";

export type StoredSubscription = { endpoint: string; p256dh: string; auth: string };

export async function listSubscriptions(userId: string): Promise<StoredSubscription[]> {
  if (isStaging()) {
    const db = await stagingDatabase();
    return (await db.prepare("SELECT endpoint,p256dh,auth FROM push_subscriptions WHERE user_id=?").bind(userId).all<StoredSubscription>()).results;
  }
  const { data, error } = await supabaseAdmin().from("push_subscriptions").select("endpoint,p256dh,auth").eq("user_id", userId);
  if (error) throw new Error("Push subscription lookup failed");
  return data ?? [];
}

export async function saveSubscription(userId: string, sub: SerializableSubscription, userAgent: string): Promise<boolean> {
  if (isStaging()) {
    const db = await stagingDatabase();
    const result = await db.prepare(`INSERT INTO push_subscriptions (endpoint,user_id,p256dh,auth,created_at) VALUES (?,?,?,?,?)
      ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh,auth=excluded.auth
      WHERE push_subscriptions.user_id=excluded.user_id`).bind(sub.endpoint,userId,sub.keys.p256dh,sub.keys.auth,Date.now()).run();
    return result.meta.changes === 1;
  }
  const { error } = await supabaseAdmin().from("push_subscriptions").upsert({ user_id: userId, endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_agent: userAgent.slice(0,500) }, { onConflict: "endpoint" });
  return !error;
}

export async function removeSubscription(userId: string, endpoint: string): Promise<void> {
  if (isStaging()) {
    const db = await stagingDatabase();
    await db.prepare("DELETE FROM push_subscriptions WHERE user_id=? AND endpoint=?").bind(userId,endpoint).run();
    return;
  }
  const { error } = await supabaseAdmin().from("push_subscriptions").delete().eq("user_id",userId).eq("endpoint",endpoint);
  if (error) throw new Error("Push subscription removal failed");
}
