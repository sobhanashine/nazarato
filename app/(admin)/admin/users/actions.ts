"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import type { AdminUserRole } from "@/lib/data/admin";
import { supabaseAdmin } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Ban or unban an account. Banned users can't sign in (see login actions). */
export async function setUserBanned(
  userId: string,
  banned: boolean,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }

  if (typeof userId !== "string" || userId.length === 0) {
    return { ok: false, error: "شناسه نامعتبر." };
  }
  // Guard against locking yourself out.
  if (userId === admin.id) {
    return { ok: false, error: "نمی‌توانی حساب خودت را مسدود کنی." };
  }

  const { error } = await supabaseAdmin()
    .from("users")
    .update({ is_banned: banned, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("[admin] setUserBanned failed", {
      userId,
      banned,
      error: error.message,
    });
    return { ok: false, error: "خطا در بروزرسانی کاربر." };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

/** Promote a user to admin or demote back to consumer. */
export async function setUserRole(
  userId: string,
  role: AdminUserRole,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }

  if (typeof userId !== "string" || userId.length === 0) {
    return { ok: false, error: "شناسه نامعتبر." };
  }
  if (role !== "consumer" && role !== "admin") {
    return { ok: false, error: "نقش نامعتبر." };
  }
  // Don't let an admin strip their own admin role (lockout guard).
  if (userId === admin.id && role !== "admin") {
    return { ok: false, error: "نمی‌توانی نقش ادمین خودت را حذف کنی." };
  }

  const { error } = await supabaseAdmin()
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("[admin] setUserRole failed", {
      userId,
      role,
      error: error.message,
    });
    return { ok: false, error: "خطا در بروزرسانی نقش." };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}
