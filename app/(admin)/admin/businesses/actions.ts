"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import type { AdminBusinessStatus } from "@/lib/data/admin";
import { supabaseAdmin } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

const STATUSES: AdminBusinessStatus[] = ["active", "pending", "merged", "hidden"];

/** Revalidate the public page for a business so a status/verify change shows. */
async function revalidateBusiness(id: string) {
  const { data } = await supabaseAdmin()
    .from("businesses")
    .select("slug, type")
    .eq("id", id)
    .single();
  if (data) {
    revalidatePath(`/${data.type === "ig_shop" ? "shop" : "company"}/${data.slug}`);
  }
  revalidatePath("/admin/businesses");
}

/** Set a business's moderation status (active / pending / merged / hidden). */
export async function setBusinessStatus(
  businessId: string,
  status: AdminBusinessStatus,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }
  if (typeof businessId !== "string" || businessId.length === 0) {
    return { ok: false, error: "شناسه نامعتبر." };
  }
  if (!STATUSES.includes(status)) {
    return { ok: false, error: "وضعیت نامعتبر." };
  }

  const { error } = await supabaseAdmin()
    .from("businesses")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) {
    console.error("[admin] setBusinessStatus failed", {
      businessId,
      status,
      error: error.message,
    });
    return { ok: false, error: "خطا در بروزرسانی وضعیت." };
  }

  await revalidateBusiness(businessId);
  return { ok: true };
}

/** Toggle a business's verified badge. */
export async function setBusinessVerified(
  businessId: string,
  verified: boolean,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }
  if (typeof businessId !== "string" || businessId.length === 0) {
    return { ok: false, error: "شناسه نامعتبر." };
  }

  const { error } = await supabaseAdmin()
    .from("businesses")
    .update({ verified, updated_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) {
    console.error("[admin] setBusinessVerified failed", {
      businessId,
      verified,
      error: error.message,
    });
    return { ok: false, error: "خطا در بروزرسانی وضعیت تأیید." };
  }

  await revalidateBusiness(businessId);
  return { ok: true };
}
