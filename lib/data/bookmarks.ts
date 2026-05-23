import { supabaseAdmin } from "@/lib/supabase/server";
import { getCategoryTitle, type Business } from "./businesses";

export async function getBookmarkStatus(userId: string, businessSlug: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  
  // First lookup business ID
  const { data: bData } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", businessSlug)
    .maybeSingle();
    
  if (!bData) return false;

  const { data, error } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("business_id", bData.id)
    .maybeSingle();

  if (error) {
    console.error("[bookmarks] Failed to get bookmark status", error.message);
    return false;
  }

  return !!data;
}

interface DbBookmarkBusinessRow {
  slug: string;
  name: string;
  type: string;
  category_slug: string;
  city: string | null;
  initial: string;
  color: string;
  review_count: number;
  rating_avg: number | null;
  verified: boolean;
}

export async function getUserBookmarks(
  userId: string,
  type?: "company" | "ig_shop"
): Promise<Business[]> {
  const supabase = supabaseAdmin();

  // Inner-join `businesses` so that the type filter actually restricts the
  // parent bookmark rows (a plain embedded select would return bookmarks with
  // `business: null` for the unmatched type, which the page can't show anyway).
  let query = supabase
    .from("bookmarks")
    .select("created_at, business:businesses!inner(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("business.type", type);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("[bookmarks] Failed to get user bookmarks", error?.message);
    return [];
  }

  return data
    .map((row): Business | null => {
      const b = row.business as unknown as DbBookmarkBusinessRow | null;
      if (!b) return null;

      const scoreVal = b.rating_avg ? Number(b.rating_avg) : 0.0;
      return {
        slug: b.slug,
        name: b.name,
        category: getCategoryTitle(b.category_slug),
        city: b.city || "نامشخص",
        initial: b.initial,
        color: b.color,
        score:
          b.review_count > 0
            ? scoreVal.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
            : "—",
        reviews: b.review_count.toLocaleString("fa-IR"),
        verified: b.verified,
      };
    })
    .filter((b): b is Business => b !== null);
}

export async function getPopularBusinesses(): Promise<Business[]> {
  const supabase = supabaseAdmin();
  
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .in("status", ["active", "merged"])
    .order("review_count", { ascending: false })
    .order("rating_avg", { ascending: false })
    .limit(4);

  if (error || !data) {
    return [];
  }

  return data.map((b) => {
    const scoreVal = b.rating_avg ? Number(b.rating_avg) : 0.0;
    return {
      slug: b.slug,
      name: b.name,
      category: getCategoryTitle(b.category_slug),
      city: b.city || "نامشخص",
      initial: b.initial,
      color: b.color,
      score: b.review_count > 0 
        ? scoreVal.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) 
        : "—",
      reviews: b.review_count.toLocaleString("fa-IR"),
      verified: b.verified,
    };
  });
}
