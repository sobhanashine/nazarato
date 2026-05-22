"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/data/users";
import { supabaseAdmin } from "@/lib/supabase/server";

/** Helper to verify the active user is an admin; throws if not. */
async function verifyAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("unauthorized");
  }
  const user = await getUserById(session.id);
  if (!user || user.role !== "admin") {
    throw new Error("unauthorized");
  }
  return user;
}

/** Approve a review: publishes it and (if proof exists) marks it verified, then deletes the proof document. */
export async function approveReview(reviewId: string) {
  try {
    await verifyAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }

  const supabase = supabaseAdmin();

  // 1. Fetch review to check if it has a proof_url
  const { data: review, error: fetchError } = await supabase
    .from("reviews")
    .select("proof_url, business_id, proof_status")
    .eq("id", reviewId)
    .single();

  if (fetchError || !review) {
    return { ok: false, error: "نظر یافت نشد." };
  }

  const isProofSubmitted = review.proof_status === "submitted";
  const updates: Record<string, unknown> = {
    status: "published",
    updated_at: new Date().toISOString(),
  };

  if (isProofSubmitted) {
    updates.verified = true;
    updates.proof_status = "approved";
    updates.proof_url = null; // Nullify URL in DB
  }

  // 2. Update review status
  const { error: updateError } = await supabase
    .from("reviews")
    .update(updates)
    .eq("id", reviewId);

  if (updateError) {
    console.error("[moderation] approveReview DB update failed", {
      reviewId,
      error: updateError.message,
    });
    return { ok: false, error: "خطا در بروزرسانی نظر." };
  }

  // 3. Delete proof file from storage
  if (isProofSubmitted && review.proof_url) {
    const { error: storageError } = await supabase.storage
      .from("proofs")
      .remove([review.proof_url]);

    if (storageError) {
      console.error("[moderation] approveReview proof deletion failed", {
        reviewId,
        proofUrl: review.proof_url,
        error: storageError.message,
      });
    }
  }

  // 4. Revalidate cache
  const { data: biz } = await supabase
    .from("businesses")
    .select("slug")
    .eq("id", review.business_id)
    .single();

  if (biz) {
    revalidatePath(`/company/${biz.slug}`);
  }
  revalidatePath("/admin/moderation");

  return { ok: true };
}

/** Reject a review: sets status to rejected and deletes any proof document. */
export async function rejectReview(reviewId: string, rejectionReason?: string) {
  try {
    await verifyAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }

  const supabase = supabaseAdmin();

  // 1. Fetch review to check if it has a proof_url
  const { data: review, error: fetchError } = await supabase
    .from("reviews")
    .select("proof_url, business_id, proof_status")
    .eq("id", reviewId)
    .single();

  if (fetchError || !review) {
    return { ok: false, error: "نظر یافت نشد." };
  }

  const isProofSubmitted = review.proof_status === "submitted";
  const updates: Record<string, unknown> = {
    status: "rejected",
    rejection_reason: rejectionReason || null,
    updated_at: new Date().toISOString(),
  };

  if (isProofSubmitted) {
    updates.proof_status = "rejected";
    updates.proof_url = null; // Nullify URL in DB
  }

  // 2. Update review status
  const { error: updateError } = await supabase
    .from("reviews")
    .update(updates)
    .eq("id", reviewId);

  if (updateError) {
    console.error("[moderation] rejectReview DB update failed", {
      reviewId,
      error: updateError.message,
    });
    return { ok: false, error: "خطا در بروزرسانی نظر." };
  }

  // 3. Delete proof file from storage
  if (isProofSubmitted && review.proof_url) {
    const { error: storageError } = await supabase.storage
      .from("proofs")
      .remove([review.proof_url]);

    if (storageError) {
      console.error("[moderation] rejectReview proof deletion failed", {
        reviewId,
        proofUrl: review.proof_url,
        error: storageError.message,
      });
    }
  }

  // 4. Revalidate cache
  const { data: biz } = await supabase
    .from("businesses")
    .select("slug")
    .eq("id", review.business_id)
    .single();

  if (biz) {
    revalidatePath(`/company/${biz.slug}`);
  }
  revalidatePath("/admin/moderation");

  return { ok: true };
}

/** Generate a short-lived (5-minute) signed URL to view the private proof document. */
export async function getSignedProofUrl(proofUrl: string) {
  try {
    await verifyAdmin();
  } catch {
    return { ok: false, error: "غیرمجاز" };
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase.storage
    .from("proofs")
    .createSignedUrl(proofUrl, 300); // 5 minutes

  if (error || !data) {
    console.error("[moderation] getSignedProofUrl failed", {
      proofUrl,
      error: error?.message,
    });
    return { ok: false, error: "خطا در نمایش مدرک." };
  }

  return { ok: true, url: data.signedUrl };
}
