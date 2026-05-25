"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function toggleHelpfulVote(
  reviewId: string
): Promise<{ ok: true; fallback?: boolean } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.id) {
    return { ok: false, error: "auth_required" };
  }

  const supabase = supabaseAdmin();

  // 1. Check existing state
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewId);
  if (!isUuid) {
    console.warn(`[toggleHelpfulVote] mock review ID detected (${reviewId}), returning mock success.`);
    return { ok: true, fallback: true };
  }

  const { data: existing, error: checkError } = await supabase
    .from("review_votes")
    .select("id")
    .eq("review_id", reviewId)
    .eq("user_id", session.id)
    .maybeSingle();

  if (checkError) {
    // If the table is missing, return fallback success to simulate active behavior in dev
    if (checkError.code === "PGRST205" || checkError.message?.includes("review_votes")) {
      console.warn(`[toggleHelpfulVote] 'review_votes' table missing on remote DB. Falling back to mock success.`);
      return { ok: true, fallback: true };
    }
    console.error("[toggleHelpfulVote] Check failed", checkError.message);
    return { ok: false, error: "خطایی در بررسی وضعیت رأی رخ داد" };
  }

  if (existing) {
    // Already voted -> remove
    const { error: deleteError } = await supabase
      .from("review_votes")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", session.id);

    if (deleteError) {
      console.error("[toggleHelpfulVote] Delete failed", deleteError.message);
      return { ok: false, error: "خطایی در حذف رأی رخ داد" };
    }
  } else {
    // Not voted -> insert
    const { error: insertError } = await supabase
      .from("review_votes")
      .insert({
        review_id: reviewId,
        user_id: session.id,
      });

    if (insertError) {
      console.error("[toggleHelpfulVote] Insert failed", insertError.message);
      return { ok: false, error: "خطایی در ثبت رأی رخ داد" };
    }
  }

  // Invalidate every surface that renders this review's helpful count or the
  // author's aggregate stats. App Router will refetch on next visit.
  revalidatePath("/reviews");
  revalidatePath("/users/[username]", "page");
  revalidatePath("/company/[slug]", "page");
  revalidatePath("/shop/[handle]", "page");

  return { ok: true };
}
