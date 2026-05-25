"use server";

/**
 * Server actions for the owner review inbox.
 *
 * Two write paths:
 *   - `submitOwnerResponse`: post / edit / delete the owner's public reply.
 *     The `tr_review_owner_response` trigger (migration 0009) syncs
 *     `has_owner_response` automatically — actions only write the body.
 *   - `flagReviewForRemoval`: opens a moderation ticket via the existing
 *     notifications fan-out (no dedicated `reports` table yet — solo-founder
 *     scope keeps it lean; the admin sees the link and moderates from
 *     `/admin/moderation`). Reason is stored in the notification body, not a
 *     report row, so it's discoverable but not queryable. Good enough until
 *     report volume justifies a real table.
 *
 * Ownership is re-checked here on every call — the layout's check happens at
 * page-render time and cannot be trusted at action-invocation time.
 */
import { revalidatePath } from "next/cache";
import { sendPushToUser, sendPushToUsers } from "@/lib/push/server";
import { getSession } from "@/lib/auth/session";
import { getReviewForOwner } from "@/lib/data/owner";
import { supabaseAdmin } from "@/lib/supabase/server";

const RESPONSE_MIN = 10;
const RESPONSE_MAX = 1500;

export type OwnerActionState = {
  status: "idle" | "ok" | "error";
  message?: string;
};

export async function submitOwnerResponse(
  _prev: OwnerActionState,
  formData: FormData,
): Promise<OwnerActionState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "ابتدا وارد حساب شو." };

  const reviewId = String(formData.get("reviewId") ?? "").trim();
  const intent = String(formData.get("intent") ?? "save"); // "save" | "delete"
  const body = String(formData.get("body") ?? "").trim();

  if (!reviewId) return { status: "error", message: "شناسه نظر معتبر نیست." };

  const ctx = await getReviewForOwner(session.id, reviewId);
  if (!ctx) {
    return { status: "error", message: "این نظر در دامنه‌ی شما نیست." };
  }

  if (intent === "delete") {
    const { error } = await supabaseAdmin()
      .from("reviews")
      .update({ owner_response_body: null })
      .eq("id", ctx.review.id);
    if (error) {
      console.error("[owner] submitOwnerResponse(delete) failed", {
        reviewId,
        error: error.message,
      });
      return { status: "error", message: "حذف پاسخ ناموفق بود." };
    }
    revalidatePath("/business/reviews");
    revalidatePath("/business");
    revalidatePath(`/company/${ctx.business.slug}`);
    revalidatePath(`/company/${ctx.business.slug}/reviews`);
    return { status: "ok", message: "پاسخ حذف شد." };
  }

  if (body.length < RESPONSE_MIN || body.length > RESPONSE_MAX) {
    return {
      status: "error",
      message: `پاسخ باید بین ${RESPONSE_MIN} تا ${RESPONSE_MAX.toLocaleString("fa-IR")} کاراکتر باشد.`,
    };
  }

  const { error } = await supabaseAdmin()
    .from("reviews")
    .update({ owner_response_body: body })
    .eq("id", ctx.review.id);

  if (error) {
    console.error("[owner] submitOwnerResponse(save) failed", {
      reviewId,
      error: error.message,
    });
    return { status: "error", message: "ثبت پاسخ ناموفق بود." };
  }

  // Notify the review author. Failures are non-blocking — the reply is the
  // important state change, the notification is convenience.
  try {
    const title = `پاسخ از ${ctx.business.name}`;
    const notifBody = body.length > 120 ? body.slice(0, 117) + "…" : body;
    const link = `/company/${ctx.business.slug}/reviews#review-${ctx.review.id}`;
    await supabaseAdmin().from("notifications").insert({
      user_id: ctx.review.author_id,
      type: "owner_replied",
      title,
      body: notifBody,
      link,
    });
    await sendPushToUser(ctx.review.author_id, {
      title,
      body: notifBody,
      link,
      tag: `owner_replied_${ctx.review.id}`,
    });
  } catch (err) {
    console.error("[owner] reply notification failed", { reviewId, err });
  }

  revalidatePath("/business/reviews");
  revalidatePath("/business");
  revalidatePath(`/company/${ctx.business.slug}`);
  revalidatePath(`/company/${ctx.business.slug}/reviews`);
  return { status: "ok", message: "پاسخ شما ثبت شد." };
}

export async function flagReviewForRemoval(
  _prev: OwnerActionState,
  formData: FormData,
): Promise<OwnerActionState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "ابتدا وارد حساب شو." };

  const reviewId = String(formData.get("reviewId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!reviewId) return { status: "error", message: "شناسه نظر معتبر نیست." };
  if (reason.length === 0) {
    return { status: "error", message: "دلیل گزارش را انتخاب کن." };
  }
  if (notes.length > 500) {
    return { status: "error", message: "توضیحات نباید از ۵۰۰ کاراکتر بیشتر باشد." };
  }

  const ctx = await getReviewForOwner(session.id, reviewId);
  if (!ctx) {
    return { status: "error", message: "این نظر در دامنه‌ی شما نیست." };
  }

  try {
    const supabase = supabaseAdmin();
    // Bump the public report counter so admin moderation sorts by attention.
    // No RPC for atomic increment yet — read-then-write is fine here because
    // flags are infrequent and an off-by-one on the count doesn't matter.
    const { data: cur } = await supabase
      .from("reviews")
      .select("report_count")
      .eq("id", ctx.review.id)
      .single();
    await supabase
      .from("reviews")
      .update({ report_count: ((cur?.report_count as number) ?? 0) + 1 })
      .eq("id", ctx.review.id);

    // Notify every admin.
    const { data: admins } = await supabase.from("users").select("id").eq("role", "admin");
    const adminIds = (admins ?? []).map((a: { id: string }) => a.id);
    if (adminIds.length > 0) {
      const title = `گزارش نظر — ${ctx.business.name}`;
      const body = `دلیل: ${reason}${notes ? ` — ${notes}` : ""}`;
      const link = `/admin/moderation?focus=${ctx.review.id}`;
      await supabase.from("notifications").insert(
        adminIds.map((id) => ({
          user_id: id,
          type: "admin_review_flagged" as const,
          title,
          body,
          link,
        })),
      );
      await sendPushToUsers(adminIds, { title, body, link, tag: `admin_review_flagged_${ctx.review.id}` });
    }
  } catch (err) {
    console.error("[owner] flagReviewForRemoval notification failed", { reviewId, err });
    return { status: "error", message: "ثبت گزارش ناموفق بود." };
  }

  revalidatePath("/business/reviews");
  return { status: "ok", message: "گزارش برای تیم بازبینی ارسال شد." };
}
