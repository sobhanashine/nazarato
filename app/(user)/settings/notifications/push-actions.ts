"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { isStaging } from "@/lib/auth/login-policy";
import { consumeLimit, stagingDatabase } from "@/lib/staging/database";
import { isPushEndpoint, parseSubscription } from "@/lib/push/subscription";
import { listSubscriptions, removeSubscription, saveSubscription } from "@/lib/push/store";
import { pushConfiguration, sendPushToUser } from "@/lib/push/server";

export type PushActionState = { ok?: boolean; error?: string };

export async function savePushSubscription(input: unknown, userAgent: unknown): Promise<PushActionState> {
  const session = await getSession();
  if (!session) return { error: "نشست شما منقضی شده است." };
  const sub = parseSubscription(input);
  if (!sub || typeof userAgent !== "string") return { error: "اشتراک نامعتبر است." };
  if (!pushConfiguration()) return { error: "سرویس اعلان هنوز آماده نیست." };
  try {
    if (!(await saveSubscription(session.id, sub, userAgent))) return { error: "اشتراک ذخیره نشد. ابتدا اعلان این مرورگر را غیرفعال کن و دوباره تلاش کن." };
    revalidatePath("/settings/notifications");
    return { ok: true };
  } catch {
    console.error("[push] save failed", { userId: session.id });
    return { error: "خطا در ذخیره اشتراک اعلان." };
  }
}

export async function removePushSubscription(endpoint: unknown): Promise<PushActionState> {
  const session = await getSession();
  if (!session) return { error: "نشست شما منقضی شده است." };
  if (!isPushEndpoint(endpoint)) return { error: "اشتراک نامعتبر است." };
  try {
    await removeSubscription(session.id, endpoint);
    revalidatePath("/settings/notifications");
    return { ok: true };
  } catch {
    console.error("[push] remove failed", { userId: session.id });
    return { error: "خطا در حذف اشتراک اعلان." };
  }
}

export async function hasPushSubscription(endpoint: unknown): Promise<boolean> {
  const session = await getSession();
  if (!session || !isPushEndpoint(endpoint)) return false;
  try { return (await listSubscriptions(session.id)).some((s) => s.endpoint === endpoint); }
  catch { return false; }
}

export async function testPushSubscription(endpoint: unknown): Promise<PushActionState> {
  if (!isStaging()) return { error: "آزمون اعلان فقط در محیط آزمایشی در دسترس است." };
  const session = await getSession();
  if (!session || !isPushEndpoint(endpoint)) return { error: "نشست یا اشتراک نامعتبر است." };
  try {
    if (!(await consumeLimit(await stagingDatabase(), `push-test:${session.id}`, 3, 60_000))) return { error: "کمی صبر کن و دوباره امتحان کن." };
    const result = await sendPushToUser(session.id, { title: "آزمون اعلان نظراتو", body: "اعلان محیط آزمایشی به این دستگاه رسید.", link: "/settings/notifications", tag: "staging-self-test" }, endpoint);
    return result.accepted > 0 ? { ok: true } : { error: "سرویس اعلان ارسال را تأیید نکرد. اشتراک دستگاه را دوباره فعال کن." };
  } catch {
    console.error("[push] self-test failed", { userId: session.id });
    return { error: "آزمون اعلان در حال حاضر در دسترس نیست." };
  }
}
