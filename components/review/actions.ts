"use server";

/**
 * Quick-review submission — the boundary for the bottom-sheet review wizard.
 *
 * A deliberately minimal review: rating + body only (no title, proof or date).
 * The session and every field are re-validated here — form values are
 * untrusted, a signed cookie is not.
 */

import { getSession } from "@/lib/auth/session";
import {
  getReviewTargets,
  PUBLIC_BUSINESS_SOURCE_GATE_SELECT,
  PUBLIC_BUSINESS_STATUSES,
  type ReviewTargetLoadResult,
} from "@/lib/data/businesses";
import { notifyAdminsOfNewReview } from "@/lib/data/notifications";
import { persistReviewAnalysisBestEffort } from "@/lib/data/review-analysis-persistence";
import { supabaseAdmin } from "@/lib/supabase/server";

const BODY_MIN = 10;
const BODY_MAX = 2000;

const faNum = (n: number) => n.toLocaleString("fa-IR");

/** Result shape consumed via `useActionState`. */
export type QuickReviewState = {
  ok: boolean;
  /** User-facing error; absent on success. */
  error?: string;
  /** True when the failure is a lost/absent session — the UI gates on login. */
  needsAuth?: boolean;
};

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Persian/Arabic-Indic digits → ASCII so a tampered `rating` still parses. */
function toAsciiDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

/** Fresh, public-only supply loaded when the picker opens. */
export async function loadReviewTargets(): Promise<ReviewTargetLoadResult> {
  try {
    return await getReviewTargets();
  } catch (error) {
    console.error("[review-targets] unexpected load failure", {
      error: error instanceof Error ? error.message : "unknown error",
    });
    return { ok: false, businesses: [] };
  }
}

export async function submitQuickReview(
  _prev: QuickReviewState,
  formData: FormData,
): Promise<QuickReviewState> {
  const session = await getSession();
  if (!session) {
    return { ok: false, needsAuth: true, error: "برای ثبت نظر باید وارد حساب شوی." };
  }

  const slug = asString(formData.get("slug"));
  if (!slug) {
    return { ok: false, error: "اول کسب‌وکار موردنظر را انتخاب کن." };
  }
  if (slug.length > 160 || !/^[\p{L}\p{N}_-]+$/u.test(slug)) {
    return { ok: false, error: "شناسه کسب‌وکار انتخاب‌شده معتبر نیست." };
  }

  const rating = Number(toAsciiDigits(asString(formData.get("rating"))));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "یک امتیاز بین ۱ تا ۵ ستاره انتخاب کن." };
  }

  const body = asString(formData.get("body"));
  if (body.length < BODY_MIN) {
    return { ok: false, error: `متن نظر باید حداقل ${faNum(BODY_MIN)} کاراکتر باشد.` };
  }
  if (body.length > BODY_MAX) {
    return { ok: false, error: `متن نظر باید حداکثر ${faNum(BODY_MAX)} کاراکتر باشد.` };
  }

  const supabase = supabaseAdmin();

  const { data: businessRow, error: bizError } = await supabase
    .from("businesses")
    .select(`id, name, ${PUBLIC_BUSINESS_SOURCE_GATE_SELECT}`)
    .eq("slug", slug)
    .in("status", PUBLIC_BUSINESS_STATUSES)
    .eq("business_sources.status", "approved")
    .single();

  if (bizError && bizError.code !== "PGRST116") {
    console.error("[quick-review] business eligibility lookup failed", {
      authorId: session.id,
      code: bizError.code ?? "unknown",
    });
  }

  if (bizError || !businessRow) {
    return {
      ok: false,
      error: "این کسب‌وکار فعلاً امکان دریافت نظر ندارد.",
    };
  }

  const { data: insertedReview, error: insertError } = await supabase
    .from("reviews")
    .insert({
      business_id: businessRow.id,
      author_id: session.id,
      rating,
      title: null,
      body,
      status: "pending",
      verified: false,
      proof_status: "none",
      proof_url: null,
      proof_type: null,
      purchase_date: null,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "شما قبلاً برای این کسب‌وکار نظر ثبت کرده‌اید." };
    }
    console.error("[quick-review] insert failed", {
      authorId: session.id,
      error: insertError.message,
    });
    return { ok: false, error: "خطا در ثبت نظر. لطفاً دوباره تلاش کن." };
  }

  if (!insertedReview?.id || typeof insertedReview.id !== "string") {
    console.error("[quick-review] insert returned no review id", {
      authorId: session.id,
      businessId: businessRow.id,
    });
    return { ok: false, error: "خطا در ثبت نظر. لطفاً دوباره تلاش کن." };
  }

  // Analysis is deliberately best-effort: a review remains publishable in the
  // moderation queue even if the optional intelligence write is unavailable.
  await persistReviewAnalysisBestEffort(insertedReview.id, body);

  await notifyAdminsOfNewReview({ businessName: businessRow.name });

  return { ok: true };
}
