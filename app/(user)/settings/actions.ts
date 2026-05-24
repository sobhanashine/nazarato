"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { updateUserNotificationSettings, updateUserPrivacy } from "@/lib/data/users";

export type ActionState = {
  success?: boolean;
  error?: string;
};

/**
 * Update the user's in-website notification settings.
 */
export async function updateNotificationSettings(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) {
    return { error: "نشست شما منقضی شده است. لطفا دوباره وارد شوید." };
  }

  const notification_replies = formData.get("notification_replies") === "on";
  const notification_bookmarks = formData.get("notification_bookmarks") === "on";

  try {
    await updateUserNotificationSettings(session.id, {
      notification_replies,
      notification_bookmarks,
    });
    revalidatePath("/settings/notifications");
    return { success: true };
  } catch (error: unknown) {
    console.error("[settings/actions] updateNotificationSettings failed", {
      userId: session.id,
      error,
    });
    return { error: "خطایی در ذخیره تنظیمات رخ داد. لطفا دوباره تلاش کنید." };
  }
}

/**
 * Update the user's public profile privacy toggle.
 */
export async function updatePrivacySettings(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) {
    return { error: "نشست شما منقضی شده است. لطفا دوباره وارد شوید." };
  }

  const publicProfile = formData.get("public_profile") === "on";

  try {
    await updateUserPrivacy(session.id, publicProfile);
    revalidatePath("/settings/privacy");
    return { success: true };
  } catch (error: unknown) {
    console.error("[settings/actions] updatePrivacySettings failed", {
      userId: session.id,
      error,
    });
    return { error: "خطایی در ذخیره تنظیمات رخ داد. لطفا دوباره تلاش کنید." };
  }
}
