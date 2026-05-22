import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/data/users";
import { supabaseAdmin } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ModerationQueueClient } from "./ModerationQueueClient";
import type { Rating } from "@/components/ui/RatingStars";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=/admin/moderation`);
  }

  const user = await getUserById(session.id);
  if (!user || user.role !== "admin") {
    notFound();
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      title,
      body,
      proof_status,
      proof_type,
      proof_url,
      purchase_date,
      created_at,
      businesses (
        name,
        slug
      ),
      users (
        display_name,
        phone
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[moderation] failed to fetch pending reviews", error.message);
  }

  interface DbPendingReview {
    id: string;
    rating: number;
    title: string | null;
    body: string;
    proof_status: string;
    proof_type: string | null;
    proof_url: string | null;
    purchase_date: string | null;
    created_at: string;
    businesses: {
      name: string;
      slug: string;
    } | null;
    users: {
      display_name: string;
      phone: string;
    } | null;
  }

  const dataList = (data || []) as unknown as DbPendingReview[];

  const pendingReviews = dataList.map((row) => ({
    id: row.id,
    rating: row.rating as Rating,
    title: row.title || null,
    body: row.body,
    proof_status: row.proof_status,
    proof_type: row.proof_type || null,
    proof_url: row.proof_url || null,
    purchase_date: row.purchase_date || null,
    created_at: row.created_at,
    business_name: row.businesses?.name || "نامشخص",
    business_slug: row.businesses?.slug || "",
    author_name: row.users?.display_name || "کاربر ناشناس",
    author_phone: row.users?.phone || "بدون شماره",
  }));

  return <ModerationQueueClient initialReviews={pendingReviews} />;
}
