"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Revalidate the public business page tied to a review, plus the reports inbox. */
async function revalidateForReview(reviewId: string) {
  const { data } = await supabaseAdmin()
    .from("reviews")
    .select("businesses ( slug, type )")
    .eq("id", reviewId)
    .single();
  const biz = (data as { businesses: { slug: string; type: string } | null } | null)
    ?.businesses;
  if (biz) {
    revalidatePath(`/${biz.type === "ig_shop" ? "shop" : "company"}/${biz.slug}`);
  }
  revalidatePath("/admin/reports");
}

/** Dismiss the reports on a review (keeps it published, clears the count). */
export async function dismissReports(reviewId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }
  if (typeof reviewId !== "string" || reviewId.length === 0) {
    return { ok: false, error: "شناسه نامعتبر." };
  }

  const { error } = await supabaseAdmin()
    .from("reviews")
    .update({ report_count: 0, updated_at: new Date().toISOString() })
    .eq("id", reviewId);

  if (error) {
    console.error("[admin] dismissReports failed", {
      reviewId,
      error: error.message,
    });
    return { ok: false, error: "خطا در رد گزارش‌ها." };
  }

  await revalidateForReview(reviewId);
  return { ok: true };
}

/** Take down a reported review (reject it and clear the report count). */
export async function removeReportedReview(
  reviewId: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }
  if (typeof reviewId !== "string" || reviewId.length === 0) {
    return { ok: false, error: "شناسه نامعتبر." };
  }

  const { error } = await supabaseAdmin()
    .from("reviews")
    .update({
      status: "rejected",
      rejection_reason: "حذف توسط مدیر پس از گزارش کاربران",
      report_count: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  if (error) {
    console.error("[admin] removeReportedReview failed", {
      reviewId,
      error: error.message,
    });
    return { ok: false, error: "خطا در حذف نظر." };
  }

  await revalidateForReview(reviewId);
  return { ok: true };
}
