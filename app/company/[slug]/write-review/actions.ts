"use server";

/**
 * Write-review server action — the review-submission boundary.
 *
 * Every field is validated here against untrusted `FormData` before anything is
 * accepted (AGENTS.md: "Validate all API/route inputs at the boundary"). The
 * session is re-read server-side — a hidden form field could be forged, a
 * signed cookie cannot.
 *
 * DEV NOTE: there is no `reviews` table yet. `businesses` is still fixture data
 * (`lib/data/businesses.ts`), so a real `business_id` FK can't exist until they
 * move to Supabase (issue #16/#18). Until then a fully-validated submission is
 * logged and accepted. When the table lands, replace the `console.info` block
 * with an insert — `status: 'pending'`, `proof_status: 'submitted' | 'none'` —
 * and enforce `UNIQUE (business_id, author_id)`. See docs/data-model.md §4.
 */

import { getSession } from "@/lib/auth/session";
import { getBusiness } from "@/lib/data/businesses";
import { notifyAdminsOfNewReview } from "@/lib/data/notifications";
import { supabaseAdmin } from "@/lib/supabase/server";

const BODY_MIN = 30;
const BODY_MAX = 2000;
const TITLE_MIN = 3;
const TITLE_MAX = 80;
const PROOF_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** `proof_type` values valid for a company listing (see data-model.md §4). */
const PROOF_TYPES = ["invoice", "sms", "tracking", "receipt"] as const;
const PROOF_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

/** Form fields that can carry an inline validation error. */
export type ReviewField =
  | "rating"
  | "title"
  | "body"
  | "purchaseDate"
  | "proof";

/** Result shape consumed via `useActionState`. */
export type WriteReviewState = {
  ok: boolean;
  /** Form-level error (auth lost, business gone, unexpected failure). */
  error?: string;
  /** Per-field errors, placed inline next to their input. */
  fieldErrors?: Partial<Record<ReviewField, string>>;
  /** Set on success — the client stashes a flash toast then navigates here. */
  redirectUrl?: string;
};

const faNum = (n: number) => n.toLocaleString("fa-IR");

/** Coerce an untrusted form value to a trimmed string. */
function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Persian/Arabic-Indic digits → ASCII, so a tampered `rating` still parses. */
function toAsciiDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

/**
 * Validate a submitted review and (in dev) accept it. Wired to a
 * `<form action={...}>` via `useActionState`.
 */
export async function submitReview(
  _prev: WriteReviewState,
  formData: FormData,
): Promise<WriteReviewState> {
  // Identity — never trusted from the form.
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "نشست شما منقضی شده — دوباره وارد شو." };
  }

  // Target business — the slug rides in a hidden field; verify it resolves.
  const slug = asString(formData.get("slug"));
  const business = getBusiness(slug);
  if (!business) {
    return { ok: false, error: "کسب‌وکار موردنظر پیدا نشد." };
  }

  const fieldErrors: Partial<Record<ReviewField, string>> = {};

  // 1 — Rating: an integer 1–5.
  const rating = Number(toAsciiDigits(asString(formData.get("rating"))));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    fieldErrors.rating = "یک امتیاز بین ۱ تا ۵ ستاره انتخاب کن.";
  }

  // 2 — Title: required, 3–80 chars.
  const title = asString(formData.get("title"));
  if (!title) {
    fieldErrors.title = "نوشتن عنوان الزامی است.";
  } else if (title.length < TITLE_MIN) {
    fieldErrors.title = `عنوان حداقل ${faNum(TITLE_MIN)} کاراکتر است.`;
  } else if (title.length > TITLE_MAX) {
    fieldErrors.title = `عنوان حداکثر ${faNum(TITLE_MAX)} کاراکتر است.`;
  }

  // 3 — Body: required, 30–2000 chars.
  const body = asString(formData.get("body"));
  if (body.length < BODY_MIN) {
    fieldErrors.body = `متن نظر حداقل ${faNum(BODY_MIN)} کاراکتر است.`;
  } else if (body.length > BODY_MAX) {
    fieldErrors.body = `متن نظر حداکثر ${faNum(BODY_MAX)} کاراکتر است.`;
  }

  // 5 — Purchase date: optional; a valid date, not in the future.
  const purchaseDateRaw = asString(formData.get("purchaseDate"));
  let purchaseDate: string | null = null;
  if (purchaseDateRaw) {
    const parsed = new Date(purchaseDateRaw);
    if (Number.isNaN(parsed.getTime())) {
      fieldErrors.purchaseDate = "تاریخ خرید معتبر نیست.";
    } else if (parsed.getTime() > Date.now()) {
      fieldErrors.purchaseDate = "تاریخ خرید نمی‌تواند در آینده باشد.";
    } else {
      purchaseDate = purchaseDateRaw;
    }
  }

  // 6 — Proof of purchase: optional. A file makes the review eligible for the
  // «نقد تأییدشده» tier after a private admin check; no file is still valid as
  // a «نقد عادی». Verification is never a gate — see data-model.md §4.
  const proofFile = formData.get("proof");
  const proofTypeRaw = asString(formData.get("proofType"));
  const hasProof = proofFile instanceof File && proofFile.size > 0;
  let proofStatus: "none" | "submitted" = "none";
  let proofType: string | null = null;
  if (hasProof) {
    if (proofFile.size > PROOF_MAX_BYTES) {
      fieldErrors.proof = "حجم فایل باید کمتر از ۵ مگابایت باشد.";
    } else if (!PROOF_MIME.includes(proofFile.type)) {
      fieldErrors.proof = "فقط تصویر (JPG/PNG/WebP) یا PDF پذیرفته می‌شود.";
    } else if (!(PROOF_TYPES as readonly string[]).includes(proofTypeRaw)) {
      fieldErrors.proof = "نوع سند خرید را مشخص کن.";
    } else {
      proofStatus = "submitted";
      proofType = proofTypeRaw;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const supabase = supabaseAdmin();

  // 1. Fetch business ID from DB
  const { data: businessRow, error: bizError } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (bizError || !businessRow) {
    return { ok: false, error: "کسب‌وکار موردنظر در سیستم ثبت نشده است." };
  }

  // 2. Upload proof if provided
  let proofUrl: string | null = null;
  if (hasProof) {
    const file = proofFile as File;
    const ext = file.name.split(".").pop() || "bin";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${session.id}/${filename}`;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from("proofs")
        .upload(filePath, buffer, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("[review] proof upload failed", {
          authorId: session.id,
          error: uploadError.message,
        });
        return { ok: false, error: "خطا در آپلود مدرک خرید. لطفاً دوباره تلاش کنید." };
      }
      proofUrl = filePath;
    } catch (err: unknown) {
      console.error("[review] proof processing failed", err);
      return { ok: false, error: "خطا در پردازش فایل مدرک خرید." };
    }
  }

  // 3. Write review to database
  const { error: insertError } = await supabase
    .from("reviews")
    .insert({
      business_id: businessRow.id,
      author_id: session.id,
      rating,
      title: title || null,
      body,
      status: "pending",
      verified: false,
      proof_status: proofStatus,
      proof_url: proofUrl,
      proof_type: proofType || null,
      purchase_date: purchaseDate,
    });

  if (insertError) {
    // If unique constraint violated
    if (insertError.code === "23505") {
      if (proofUrl) {
        await supabase.storage.from("proofs").remove([proofUrl]);
      }
      return { ok: false, error: "شما قبلاً برای این کسب‌وکار نظر ثبت کرده‌اید." };
    }

    console.error("[review] DB insert failed", {
      authorId: session.id,
      error: insertError.message,
    });

    if (proofUrl) {
      await supabase.storage.from("proofs").remove([proofUrl]);
    }
    return { ok: false, error: "خطا در ثبت نظر در سیستم." };
  }

  await notifyAdminsOfNewReview({ businessName: businessRow.name });

  return { ok: true, redirectUrl: `/company/${slug}` };
}
