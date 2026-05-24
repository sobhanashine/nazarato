"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export type PushActionState = {
  ok?: boolean;
  error?: string;
};

export type SerializableSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function savePushSubscription(
  sub: SerializableSubscription,
  userAgent: string
): Promise<PushActionState> {
  const session = await getSession();
  if (!session) return { error: "نشست شما منقضی شده است." };

  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { error: "اشتراک نامعتبر است." };
  }

  const { error } = await supabaseAdmin()
    .from("push_subscriptions")
    .upsert(
      {
        user_id: session.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: userAgent.slice(0, 500),
      },
      { onConflict: "endpoint" }
    );

  if (error) {
    console.error("[push] savePushSubscription failed", {
      userId: session.id,
      error: error.message,
    });
    return { error: "خطا در ذخیره اشتراک اعلان." };
  }

  revalidatePath("/settings/notifications");
  return { ok: true };
}

export async function removePushSubscription(
  endpoint: string
): Promise<PushActionState> {
  const session = await getSession();
  if (!session) return { error: "نشست شما منقضی شده است." };

  const { error } = await supabaseAdmin()
    .from("push_subscriptions")
    .delete()
    .eq("user_id", session.id)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("[push] removePushSubscription failed", {
      userId: session.id,
      error: error.message,
    });
    return { error: "خطا در حذف اشتراک اعلان." };
  }

  revalidatePath("/settings/notifications");
  return { ok: true };
}
