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

export async function getUserBookmarks(
  userId: string,
  type?: "company" | "ig_shop"
): Promise<Business[]> {
  const supabase = supabaseAdmin();

  // We join bookmarks with businesses
  let query = supabase
    .from("bookmarks")
    .select(`
      created_at,
      business:businesses (*)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Currently Supabase JS doesn't support filtering on joined tables cleanly without inner joins if type is specified
  // Wait, if it's an inner join we can filter.
  if (type) {
    query = query.eq("businesses.type", type).not("businesses", "is", null);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("[bookmarks] Failed to get user bookmarks", error?.message);
    return [];
  }

  // Map to Business card shape
  const bookmarks: Business[] = [];

  for (const row of data) {
    const b = row.business;
    if (!b) continue; // Skip if null due to filter

    // Type casting because we know the schema
    const bRow = b as any;

    if (type && bRow.type !== type) {
        continue;
    }

    const scoreVal = bRow.rating_avg ? Number(bRow.rating_avg) : 0.0;
    
    bookmarks.push({
      slug: bRow.slug,
      name: bRow.name,
      category: getCategoryTitle(bRow.category_slug),
      city: bRow.city || "نامشخص",
      initial: bRow.initial,
      color: bRow.color,
      score: bRow.review_count > 0 
        ? scoreVal.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) 
        : "—",
      reviews: bRow.review_count.toLocaleString("fa-IR"),
      verified: bRow.verified,
    });
  }

  return bookmarks;
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
