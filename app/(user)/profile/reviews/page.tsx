import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyReviewsList } from "@/components/profile/MyReviewsList";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { toRelativePersianTime } from "@/lib/data/businesses";
import type { MyReview, ReviewStatus } from "@/lib/data/profile";
import type { Rating } from "@/components/ui/RatingStars";

export const metadata: Metadata = {
  title: "نظرات من — نظراتو",
};

export const dynamic = "force-dynamic";

export default async function MyReviewsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/profile/reviews");
  }

  const supabase = supabaseAdmin();
  const { data: dbReviews, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      created_at,
      body,
      status,
      business:businesses (
        name,
        slug
      )
    `)
    .eq("author_id", session.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[profile/reviews] Failed to fetch user reviews", {
      userId: session.id,
      error: error.message,
    });
  }

  interface DbProfileReview {
    id: string;
    rating: number;
    created_at: string;
    body: string;
    status: string;
    business: {
      name: string;
      slug: string;
    } | null;
  }

  const reviewsList = (dbReviews || []) as unknown as DbProfileReview[];

  const reviews: MyReview[] = reviewsList.map((r) => {
    const biz = r.business || { name: "کسب‌وکار ناشناس", slug: "unknown" };
    return {
      id: r.id,
      shop: {
        name: biz.name,
        href: `/company/${biz.slug}`,
      },
      date: toRelativePersianTime(r.created_at),
      rating: r.rating as Rating,
      text: r.body,
      status: r.status as ReviewStatus,
    };
  });

  return <MyReviewsList reviews={reviews} />;
}
