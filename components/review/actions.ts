"use server";

/**
 * Quick-review submission — the boundary for the bottom-sheet review wizard.
 *
 * A deliberately minimal review: rating + body only (no title, proof or date).
 * The session and every field are re-validated here — form values are
 * untrusted, a signed cookie is not.
 */

import { getSession } from "@/lib/auth/session";
import { notifyAdminsOfNewReview } from "@/lib/data/notifications";
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
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (bizError || !businessRow) {
    return { ok: false, error: "کسب‌وکار موردنظر در سیستم پیدا نشد." };
  }

  const { error: insertError } = await supabase.from("reviews").insert({
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
  });

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

  await notifyAdminsOfNewReview({ businessName: businessRow.name });

  return { ok: true };
}
