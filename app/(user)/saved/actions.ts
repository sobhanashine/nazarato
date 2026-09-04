"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  PUBLIC_BUSINESS_SOURCE_SELECT,
  PUBLIC_BUSINESS_STATUSES,
} from "@/lib/data/businesses";

const BUSINESS_SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{0,119}$/;

export async function toggleBookmark(
  businessSlug: string
): Promise<{ ok: true; bookmarked: boolean } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.id) {
    return { ok: false, error: "برای ذخیره باید وارد شوید" };
  }
  if (!BUSINESS_SLUG_PATTERN.test(businessSlug)) {
    return { ok: false, error: "کسب‌وکار پیدا نشد" };
  }

  const supabase = supabaseAdmin();

  // Lookup business ID from slug
  const { data: bData, error: bError } = await supabase
    .from("businesses")
    .select(`id, ${PUBLIC_BUSINESS_SOURCE_SELECT}`)
    .eq("slug", businessSlug)
    .in("status", PUBLIC_BUSINESS_STATUSES)
    .eq("business_sources.status", "approved")
    .maybeSingle();

  if (bError || !bData) {
    return { ok: false, error: "کسب‌وکار پیدا نشد" };
  }
  const businessId = bData.id;

  // 1. Check existing state
  const { data: existing, error: checkError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", session.id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (checkError) {
    console.error("[toggleBookmark] Check failed", checkError.message);
    return { ok: false, error: "خطایی در بررسی وضعیت ذخیره رخ داد" };
  }

  if (existing) {
    // Already bookmarked -> remove
    const { error: deleteError } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", session.id)
      .eq("business_id", businessId);

    if (deleteError) {
      console.error("[toggleBookmark] Delete failed", deleteError.message);
      return { ok: false, error: "خطایی در حذف ذخیره رخ داد" };
    }
  } else {
    // Not bookmarked -> insert
    const { error: insertError } = await supabase
      .from("bookmarks")
      .insert({
        user_id: session.id,
        business_id: businessId,
      });

    // Unique violation error code in Postgres is 23505.
    // If it's a unique violation, someone else/concurrent request inserted it, which means it's now bookmarked.
    if (insertError && insertError.code !== "23505") {
      console.error("[toggleBookmark] Insert failed", insertError.message);
      return { ok: false, error: "خطایی در ذخیره رخ داد" };
    }
  }

  const isBookmarkedNow = !existing;

  // Invalidate caches
  revalidatePath("/saved");
  revalidatePath("/company/[slug]", "page");
  revalidatePath("/shop/[handle]", "page");

  return { ok: true, bookmarked: isBookmarkedNow };
}
