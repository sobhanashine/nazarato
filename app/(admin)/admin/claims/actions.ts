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
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/server";

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

  const supabase = supabaseAdmin();

  const { data: claim, error: fetchError } = await supabase
    .from("business_claims")
    .select(`
      id, business_id, user_id, proof_url,
      businesses ( name, slug, type )
    `)
    .eq("id", claimId)
    .single();

  if (fetchError || !claim) {
    return { ok: false, error: "درخواست یافت نشد." };
  }

  type ClaimRow = {
    id: string;
    business_id: string;
    user_id: string;
    proof_url: string | null;
    businesses: { name: string; slug: string; type: string } | null;
  };
  const row = claim as unknown as ClaimRow;

  const { error: updateError } = await supabase
    .from("business_claims")
    .update({
      status: "approved",
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
      proof_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", claimId);

  if (updateError) {
    console.error("[claims] approveClaim DB update failed", {
      claimId,
      error: updateError.message,
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
    }
  }

  if (row.businesses) {
    revalidatePath(
      `/${row.businesses.type === "ig_shop" ? "shop" : "company"}/${row.businesses.slug}`,
    );
    await notifyClaimant({
      claimantId: row.user_id,
      businessName: row.businesses.name,
      businessSlug: row.businesses.slug,
      businessType: row.businesses.type as "company" | "ig_shop",
      approved: true,
    });
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

  const supabase = supabaseAdmin();

  const { data: claim, error: fetchError } = await supabase
    .from("business_claims")
    .select(`
      id, user_id, proof_url,
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
    businesses: { name: string; slug: string; type: string } | null;
  };
  const row = claim as unknown as ClaimRow;

  const { error: updateError } = await supabase
    .from("business_claims")
    .update({
      status: "rejected",
      rejection_reason: rejectionReason || null,
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
      proof_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", claimId);

  if (updateError) {
    console.error("[claims] rejectClaim DB update failed", {
      claimId,
      error: updateError.message,
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
    }
  }

  if (row.businesses) {
    await notifyClaimant({
      claimantId: row.user_id,
      businessName: row.businesses.name,
      businessSlug: row.businesses.slug,
      businessType: row.businesses.type as "company" | "ig_shop",
      approved: false,
      rejectionReason,
    });
  }
  revalidatePath("/admin/claims");

  return { ok: true };
}

export async function getSignedClaimProofUrl(proofUrl: string) {
  try {
    await verifyAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase.storage
    .from("claim-proofs")
    .createSignedUrl(proofUrl, 300);

  if (error || !data) {
    console.error("[claims] getSignedClaimProofUrl failed", {
      proofUrl,
      error: error?.message,
    });
    return { ok: false, error: "خطا در نمایش مدرک." };
  }

  return { ok: true, url: data.signedUrl };
}
