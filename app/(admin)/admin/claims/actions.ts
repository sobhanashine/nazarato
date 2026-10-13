"use server";

/**
 * Admin claim moderation — approve / reject / view proof for a `business_claims`
 * row. Approve flips the business to claimed via the `tr_business_claim_approved`
 * trigger; this action only needs to set status='approved' and delete the proof
 * file (we keep nothing private after the decision — same pattern as review
 * proofs in `app/(admin)/admin/moderation/actions.ts`).
 */

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/data/users";
import { recordSecurityEvent } from "@/lib/security/audit";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REJECTION_REASON_MAX = 300;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

async function verifyAdmin() {
  const session = await getSession();
  if (!session) throw new Error("unauthorized");
  const user = await getUserById(session.id);
  if (!user || user.role !== "admin") throw new Error("unauthorized");
  return user;
}

async function notifyClaimant(args: {
  claimantId: string;
  businessName: string;
  businessSlug: string;
  businessType: "company" | "ig_shop";
  approved: boolean;
  rejectionReason?: string;
}) {
  const linkBase = args.businessType === "ig_shop" ? "/shop" : "/company";
  const link = `${linkBase}/${args.businessSlug}`;
  const title = args.approved
    ? "ادعای مالکیت شما تأیید شد"
    : "ادعای مالکیت شما رد شد";
  const body = args.approved
    ? `حالا می‌توانی صفحه‌ی «${args.businessName}» را مدیریت کنی و به نظرات پاسخ بدهی.`
    : `درخواست شما برای «${args.businessName}» رد شد.${
        args.rejectionReason ? ` دلیل: ${args.rejectionReason}` : ""
      }`;
  const supabase = supabaseAdmin();
  await supabase.from("notifications").insert({
    user_id: args.claimantId,
    type: args.approved ? "claim_approved" : "claim_rejected",
    title,
    body,
    link,
  });
  await sendPushToUser(args.claimantId, {
    title,
    body,
    link,
    tag: args.approved ? "claim_approved" : "claim_rejected",
  });
}

export async function approveClaim(claimId: string) {
  let reviewer;
  try {
    reviewer = await verifyAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }

  if (!isUuid(claimId)) {
    return { ok: false, error: "شناسه‌ی درخواست معتبر نیست." };
  }

  const supabase = supabaseAdmin();

  const { data: claim, error: fetchError } = await supabase
    .from("business_claims")
    .select(`
      id, user_id, proof_url, status,
      businesses ( name, slug, type )
    `)
    .eq("id", claimId)
    .single();

  if (fetchError || !claim) {
    return { ok: false, error: "درخواست یافت نشد." };
  }

  type ClaimRow = {
    id: string;
    user_id: string;
    proof_url: string | null;
    status: string;
    businesses: { name: string; slug: string; type: string } | null;
  };
  const row = claim as unknown as ClaimRow;
  if (row.status !== "pending") {
    return { ok: false, error: "این درخواست قبلاً بررسی شده است." };
  }

  const decidedAt = new Date().toISOString();
  const { data: updatedClaim, error: updateError } = await supabase
    .from("business_claims")
    .update({
      status: "approved",
      verification_status: "verified",
      verified_by: reviewer.id,
      verified_at: decidedAt,
      reviewed_by: reviewer.id,
      reviewed_at: decidedAt,
      updated_at: decidedAt,
    })
    .eq("id", claimId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError || !updatedClaim) {
    console.error("[claims] approveClaim DB update failed", {
      claimId,
      error: updateError?.message ?? "claim was already decided",
    });
    return { ok: false, error: "خطا در تأیید درخواست." };
  }

  if (row.proof_url) {
    const { error: storageError } = await supabase.storage
      .from("claim-proofs")
      .remove([row.proof_url]);
    if (storageError) {
      console.error("[claims] approveClaim proof deletion failed", {
        claimId,
        error: storageError.message,
      });
      await recordSecurityEvent({
        eventType: "business_claim_proof_cleanup_failed",
        actorUserId: reviewer.id,
        subjectType: "business_claim",
        subjectId: claimId,
      });
    } else {
      const { error: clearProofError } = await supabase
        .from("business_claims")
        .update({ proof_url: null, updated_at: new Date().toISOString() })
        .eq("id", claimId)
        .eq("proof_url", row.proof_url);
      if (clearProofError) {
        console.error("[claims] approveClaim proof reference cleanup failed", {
          claimId,
          error: clearProofError.message,
        });
        await recordSecurityEvent({
          eventType: "business_claim_proof_reference_cleanup_failed",
          actorUserId: reviewer.id,
          subjectType: "business_claim",
          subjectId: claimId,
        });
      }
    }
  }

  if (row.businesses) {
    revalidatePath(
      `/${row.businesses.type === "ig_shop" ? "shop" : "company"}/${row.businesses.slug}`,
    );
    try {
      await notifyClaimant({
        claimantId: row.user_id,
        businessName: row.businesses.name,
        businessSlug: row.businesses.slug,
        businessType: row.businesses.type as "company" | "ig_shop",
        approved: true,
      });
    } catch (error: unknown) {
      console.error("[claims] approval notification failed", {
        claimId,
        error,
      });
    }
  }
  revalidatePath("/admin/claims");

  return { ok: true };
}

export async function rejectClaim(claimId: string, rejectionReason?: string) {
  let reviewer;
  try {
    reviewer = await verifyAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }

  if (!isUuid(claimId)) {
    return { ok: false, error: "شناسه‌ی درخواست معتبر نیست." };
  }
  const normalizedReason = rejectionReason?.trim() || undefined;
  if (normalizedReason && normalizedReason.length > REJECTION_REASON_MAX) {
    return { ok: false, error: "دلیل رد حداکثر ۳۰۰ کاراکتر است." };
  }

  const supabase = supabaseAdmin();

  const { data: claim, error: fetchError } = await supabase
    .from("business_claims")
    .select(`
      id, user_id, proof_url, status,
      businesses ( name, slug, type )
    `)
    .eq("id", claimId)
    .single();

  if (fetchError || !claim) {
    return { ok: false, error: "درخواست یافت نشد." };
  }

  type ClaimRow = {
    id: string;
    user_id: string;
    proof_url: string | null;
    status: string;
    businesses: { name: string; slug: string; type: string } | null;
  };
  const row = claim as unknown as ClaimRow;
  if (row.status !== "pending") {
    return { ok: false, error: "این درخواست قبلاً بررسی شده است." };
  }

  const decidedAt = new Date().toISOString();
  const { data: updatedClaim, error: updateError } = await supabase
    .from("business_claims")
    .update({
      status: "rejected",
      verification_status: "failed",
      rejection_reason: normalizedReason || null,
      reviewed_by: reviewer.id,
      reviewed_at: decidedAt,
      updated_at: decidedAt,
    })
    .eq("id", claimId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError || !updatedClaim) {
    console.error("[claims] rejectClaim DB update failed", {
      claimId,
      error: updateError?.message ?? "claim was already decided",
    });
    return { ok: false, error: "خطا در رد درخواست." };
  }

  if (row.proof_url) {
    const { error: storageError } = await supabase.storage
      .from("claim-proofs")
      .remove([row.proof_url]);
    if (storageError) {
      console.error("[claims] rejectClaim proof deletion failed", {
        claimId,
        error: storageError.message,
      });
      await recordSecurityEvent({
        eventType: "business_claim_proof_cleanup_failed",
        actorUserId: reviewer.id,
        subjectType: "business_claim",
        subjectId: claimId,
      });
    } else {
      const { error: clearProofError } = await supabase
        .from("business_claims")
        .update({ proof_url: null, updated_at: new Date().toISOString() })
        .eq("id", claimId)
        .eq("proof_url", row.proof_url);
      if (clearProofError) {
        console.error("[claims] rejectClaim proof reference cleanup failed", {
          claimId,
          error: clearProofError.message,
        });
        await recordSecurityEvent({
          eventType: "business_claim_proof_reference_cleanup_failed",
          actorUserId: reviewer.id,
          subjectType: "business_claim",
          subjectId: claimId,
        });
      }
    }
  }

  if (row.businesses) {
    try {
      await notifyClaimant({
        claimantId: row.user_id,
        businessName: row.businesses.name,
        businessSlug: row.businesses.slug,
        businessType: row.businesses.type as "company" | "ig_shop",
        approved: false,
        rejectionReason: normalizedReason,
      });
    } catch (error: unknown) {
      console.error("[claims] rejection notification failed", {
        claimId,
        error,
      });
    }
  }
  revalidatePath("/admin/claims");

  return { ok: true };
}

export async function getSignedClaimProofUrl(claimId: string) {
  let reviewer;
  try {
    reviewer = await verifyAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }

  if (!isUuid(claimId)) {
    return { ok: false, error: "شناسه‌ی درخواست معتبر نیست." };
  }

  const supabase = supabaseAdmin();
  const { data: claim, error: claimError } = await supabase
    .from("business_claims")
    .select("id, proof_url, status")
    .eq("id", claimId)
    .eq("status", "pending")
    .maybeSingle();
  if (claimError || !claim?.proof_url) {
    return { ok: false, error: "مدرک این درخواست در دسترس نیست." };
  }

  const { data, error } = await supabase.storage
    .from("claim-proofs")
    .createSignedUrl(claim.proof_url, 300);

  if (error || !data) {
    console.error("[claims] getSignedClaimProofUrl failed", {
      claimId,
      error: error?.message,
    });
    return { ok: false, error: "خطا در نمایش مدرک." };
  }

  await recordSecurityEvent({
    eventType: "business_claim_proof_viewed",
    actorUserId: reviewer.id,
    subjectType: "business_claim",
    subjectId: claimId,
  });

  return { ok: true, url: data.signedUrl };
}
