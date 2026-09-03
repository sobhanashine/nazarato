"use server";

/**
 * Claim-submission server action — the owner-claim boundary (#27).
 *
 * Mirrors `components/review/actions.ts`: every field is
 * re-validated against untrusted `FormData`, the session is re-read server-side
 * (a hidden form field could be forged, a signed cookie cannot), and the proof
 * document goes to the private `claim-proofs` bucket so only an admin can view
 * it. On approval, a DB trigger flips `businesses.claimed = true` and sets
 * `owner_id` — the server action only needs to insert a `pending` row.
 */

import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/data/users";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUsers } from "@/lib/push/server";
import {
  CLAIM_NOTES_MAX,
  CLAIM_PROOF_TYPES,
  inspectClaimProof,
  validateClaimContactPhone,
  validateClaimEmail,
} from "./claim-validation";

const MAX_OPEN_CLAIMS_PER_USER = 5;

export type ClaimField =
  | "proofType"
  | "proofEmail"
  | "proof"
  | "contactPhone"
  | "notes";

export type SubmitClaimState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<ClaimField, string>>;
  redirectUrl?: string;
};

function asString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function submitClaim(
  _prev: SubmitClaimState,
  formData: FormData,
): Promise<SubmitClaimState> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "نشست شما منقضی شده — دوباره وارد شو." };
  }

  const slug = asString(formData.get("slug"));
  if (!/^[a-z0-9][a-z0-9_-]{0,119}$/i.test(slug)) {
    return { ok: false, error: "کسب‌وکار مشخص نیست." };
  }

  const supabase = supabaseAdmin();

  // 1 — Resolve the business and refuse if it's already claimed.
  const { data: businessRow, error: bizError } = await supabase
    .from("businesses")
    .select("id, name, claimed, owner_id")
    .eq("slug", slug)
    .single();

  if (bizError || !businessRow) {
    return { ok: false, error: "کسب‌وکار موردنظر پیدا نشد." };
  }
  if (businessRow.claimed) {
    return {
      ok: false,
      error: "این کسب‌وکار قبلاً توسط مالک آن ثبت شده است.",
    };
  }

  // 2 — Per-field validation.
  const fieldErrors: Partial<Record<ClaimField, string>> = {};

  const proofType = asString(formData.get("proofType"));
  if (!(CLAIM_PROOF_TYPES as readonly string[]).includes(proofType)) {
    fieldErrors.proofType = "نوع مدرک را انتخاب کن.";
  }

  let proofEmail: string | null = null;
  if (proofType === "domain_email") {
    const rawEmail = asString(formData.get("proofEmail"));
    if (!rawEmail) {
      fieldErrors.proofEmail = "ایمیل کاری روی دامنه‌ی کسب‌وکار را وارد کن.";
    } else {
      const result = validateClaimEmail(rawEmail);
      if (result.ok) proofEmail = result.email;
      else fieldErrors.proofEmail = result.error;
    }
  }

  const proofFile = formData.get("proof");
  const hasProof = proofFile instanceof File && proofFile.size > 0;
  if (proofType === "document" || proofType === "other") {
    if (!hasProof) {
      fieldErrors.proof = "بارگذاری مدرک الزامی است.";
    }
  }

  const rawContactPhone = asString(formData.get("contactPhone"));
  let contactPhone: string | null = null;
  if (!rawContactPhone) {
    fieldErrors.contactPhone = "شماره تماس را وارد کن.";
  } else {
    const result = validateClaimContactPhone(rawContactPhone);
    if (result.ok) contactPhone = result.phone;
    else fieldErrors.contactPhone = result.error;
  }

  const notes = asString(formData.get("notes"));
  if (notes.length > CLAIM_NOTES_MAX) {
    fieldErrors.notes = `توضیحات حداکثر ${CLAIM_NOTES_MAX.toLocaleString("fa-IR")} کاراکتر است.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  // 3 — Refuse a second pending claim from the same user for the same business.
  const { data: existing } = await supabase
    .from("business_claims")
    .select("id")
    .eq("business_id", businessRow.id)
    .eq("user_id", session.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      error: "درخواست قبلی شما برای این کسب‌وکار هنوز در حال بررسی است.",
    };
  }

  const { count: openClaimCount, error: openClaimError } = await supabase
    .from("business_claims")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.id)
    .eq("status", "pending");
  if (openClaimError) {
    console.error("[claim] pending-claim count failed", {
      userId: session.id,
      error: openClaimError.message,
    });
    return { ok: false, error: "امکان بررسی سقف درخواست‌ها وجود ندارد." };
  }
  if ((openClaimCount ?? 0) >= MAX_OPEN_CLAIMS_PER_USER) {
    return {
      ok: false,
      error: "حداکثر ۵ درخواست باز مجاز است؛ ابتدا منتظر نتیجه‌ی درخواست‌های قبلی بمان.",
    };
  }

  // 4 — Upload proof to the private bucket if provided.
  let proofUrl: string | null = null;
  if (hasProof && (proofType === "document" || proofType === "other")) {
    const file = proofFile as File;

    try {
      const inspected = await inspectClaimProof(file);
      if (!inspected.ok) {
        return { ok: false, fieldErrors: { proof: inspected.error } };
      }
      const filePath = `${session.id}/${crypto.randomUUID()}.${inspected.extension}`;
      const { error: uploadError } = await supabase.storage
        .from("claim-proofs")
        .upload(filePath, inspected.buffer, {
          contentType: inspected.contentType,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("[claim] proof upload failed", {
          userId: session.id,
          error: uploadError.message,
        });
        return { ok: false, error: "خطا در آپلود مدرک. لطفاً دوباره تلاش کن." };
      }
      proofUrl = filePath;
    } catch (err: unknown) {
      console.error("[claim] proof processing failed", err);
      return { ok: false, error: "خطا در پردازش فایل مدرک." };
    }
  }

  // 5 — Insert the pending claim row.
  const { error: insertError } = await supabase
    .from("business_claims")
    .insert({
      business_id: businessRow.id,
      user_id: session.id,
      proof_type: proofType,
      proof_email: proofType === "domain_email" ? proofEmail : null,
      proof_url: proofUrl,
      contact_phone: contactPhone,
      notes: notes || null,
      status: "pending",
      verification_status: "manual_review",
    });

  if (insertError) {
    if (proofUrl) {
      await supabase.storage.from("claim-proofs").remove([proofUrl]);
    }
    // Unique partial index on (business_id, user_id) where status='pending'.
    if (insertError.code === "23505") {
      return {
        ok: false,
        error: "درخواست قبلی شما هنوز در حال بررسی است.",
      };
    }
    console.error("[claim] DB insert failed", {
      userId: session.id,
      error: insertError.message,
    });
    return { ok: false, error: "خطا در ثبت درخواست." };
  }

  // 6 — Notify admins (best-effort; never blocks the success path).
  try {
    const user = await getUserById(session.id);
    const claimantName = user?.display_name ?? "کاربر";
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin");
    const adminIds = (admins ?? []).map((a: { id: string }) => a.id);
    if (adminIds.length > 0) {
      const title = "درخواست ادعای مالکیت جدید";
      const body = `${claimantName} برای «${businessRow.name}» درخواست ادعای مالکیت داده است.`;
      const link = "/admin/claims";
      await supabase.from("notifications").insert(
        adminIds.map((id) => ({
          user_id: id,
          type: "admin_new_claim",
          title,
          body,
          link,
        })),
      );
      await sendPushToUsers(adminIds, {
        title,
        body,
        link,
        tag: "admin_new_claim",
      });
    }
  } catch (err) {
    console.error("[claim] admin notification failed", err);
  }

  return { ok: true, redirectUrl: `/company/${slug}` };
}
