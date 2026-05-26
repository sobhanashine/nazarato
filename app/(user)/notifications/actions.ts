"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  markAllAsRead,
  markAsRead,
} from "@/lib/data/notifications";

export type NotificationActionState = {
  ok?: boolean;
  error?: string;
};

export async function markNotificationRead(
  notificationId: string
): Promise<NotificationActionState> {
  const session = await getSession();
  if (!session) return { error: "unauthorized" };

  try {
    await markAsRead(session.id, notificationId);
    revalidatePath("/notifications");
    return { ok: true };
  } catch {
    return { error: "خطا در علامت‌گذاری اعلان." };
  }
}

export async function markAllNotificationsRead(): Promise<NotificationActionState> {
  const session = await getSession();
  if (!session) return { error: "unauthorized" };

  try {
    await markAllAsRead(session.id);
    revalidatePath("/notifications");
    return { ok: true };
  } catch {
    return { error: "خطا در علامت‌گذاری اعلان‌ها." };
  }
}
