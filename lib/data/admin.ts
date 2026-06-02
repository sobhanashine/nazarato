/**
 * Admin-console data layer. Reads go through the service-role client (bypasses
 * RLS); the admin role itself is enforced by the `(admin)` layout for pages and
 * by `requireAdmin` for actions.
 */
import { supabaseAdmin } from "@/lib/supabase/server";

export type AdminUserRole = "consumer" | "admin";

/** One row in the `/admin/users` table. */
export type AdminUserListItem = {
  id: string;
  display_name: string;
  username: string | null;
  phone: string;
  role: AdminUserRole;
  is_banned: boolean;
  reviews_count: number;
  created_at: string;
};

const USER_SELECT =
  "id, display_name, username, phone, role, is_banned, reviews_count, created_at";

/** Max users returned in one page of the admin list. */
const USER_LIMIT = 200;

/**
 * List users for the admin console, newest first. An optional term does a
 * case-insensitive match across display name / username / phone.
 */
export async function listAdminUsers(
  query?: string,
): Promise<AdminUserListItem[]> {
  let q = supabaseAdmin()
    .from("users")
    .select(USER_SELECT)
    .order("created_at", { ascending: false })
    .limit(USER_LIMIT);

  const term = query?.trim();
  if (term) {
    // Neutralise PostgREST or-filter metacharacters before interpolating.
    const safe = term.replace(/[%,()]/g, " ").trim();
    if (safe) {
      q = q.or(
        `display_name.ilike.%${safe}%,username.ilike.%${safe}%,phone.ilike.%${safe}%`,
      );
    }
  }

  const { data, error } = await q;
  if (error) {
    console.error("[admin] listAdminUsers failed", {
      query: term,
      error: error.message,
    });
    throw new Error("admin user list failed");
  }
  return (data ?? []) as AdminUserListItem[];
}

// ─── Businesses ───────────────────────────────────────────────────────────────

export type AdminBusinessStatus = "active" | "pending" | "merged" | "hidden";

/** One row in the `/admin/businesses` table. */
export type AdminBusinessListItem = {
  id: string;
  name: string;
  slug: string;
  type: "company" | "ig_shop";
  category_slug: string;
  city: string | null;
  status: AdminBusinessStatus;
  verified: boolean;
  claimed: boolean;
  review_count: number;
  rating_avg: number | null;
  created_at: string;
};

const BUSINESS_SELECT =
  "id, name, slug, type, category_slug, city, status, verified, claimed, review_count, rating_avg, created_at";

const BUSINESS_LIMIT = 200;

/**
 * List businesses for the admin console, newest first. Optional term matches
 * name / slug / city case-insensitively.
 */
export async function listAdminBusinesses(
  query?: string,
): Promise<AdminBusinessListItem[]> {
  let q = supabaseAdmin()
    .from("businesses")
    .select(BUSINESS_SELECT)
    .order("created_at", { ascending: false })
    .limit(BUSINESS_LIMIT);

  const term = query?.trim();
  if (term) {
    const safe = term.replace(/[%,()]/g, " ").trim();
    if (safe) {
      q = q.or(`name.ilike.%${safe}%,slug.ilike.%${safe}%,city.ilike.%${safe}%`);
    }
  }

  const { data, error } = await q;
  if (error) {
    console.error("[admin] listAdminBusinesses failed", {
      query: term,
      error: error.message,
    });
    throw new Error("admin business list failed");
  }
  return (data ?? []) as AdminBusinessListItem[];
}

// ─── Reported reviews ───────────────────────────────────────────────────────

/** One row in the `/admin/reports` inbox — a published review users flagged. */
export type ReportedReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  report_count: number;
  created_at: string;
  business_name: string;
  business_slug: string;
  business_type: "company" | "ig_shop";
  author_name: string;
};

interface ReportedReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  report_count: number;
  created_at: string;
  businesses: { name: string; slug: string; type: string } | null;
  users: { display_name: string } | null;
}

/** Reviews with at least one report, most-reported first. */
export async function listReportedReviews(): Promise<ReportedReview[]> {
  const { data, error } = await supabaseAdmin()
    .from("reviews")
    .select(
      "id, rating, title, body, status, report_count, created_at, businesses ( name, slug, type ), users ( display_name )",
    )
    .gt("report_count", 0)
    .order("report_count", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin] listReportedReviews failed", { error: error.message });
    throw new Error("admin reports list failed");
  }

  const rows = (data ?? []) as unknown as ReportedReviewRow[];
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status,
    report_count: r.report_count,
    created_at: r.created_at,
    business_name: r.businesses?.name ?? "نامشخص",
    business_slug: r.businesses?.slug ?? "",
    business_type: (r.businesses?.type as "company" | "ig_shop") ?? "company",
    author_name: r.users?.display_name ?? "کاربر ناشناس",
  }));
}

// ─── Overview ───────────────────────────────────────────────────────────────

/** Headline counts for the `/admin` dashboard tiles. */
export type AdminOverview = {
  pendingReviews: number;
  reportedReviews: number;
  pendingClaims: number;
  newBusinesses: number;
};

/** A head-only `count: exact` query against `table` — returns no row payload. */
function buildCountQuery(table: string) {
  return supabaseAdmin().from(table).select("*", { count: "exact", head: true });
}

/** Gather the dashboard counts. New businesses = created in the last 7 days. */
export async function getAdminOverview(): Promise<AdminOverview> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [pendingReviews, reportedReviews, pendingClaims, newBusinesses] =
    await Promise.all([
      buildCountQuery("reviews").eq("status", "pending"),
      buildCountQuery("reviews").gt("report_count", 0),
      buildCountQuery("business_claims").eq("status", "pending"),
      buildCountQuery("businesses").gte("created_at", sevenDaysAgo),
    ]);

  for (const r of [pendingReviews, reportedReviews, pendingClaims, newBusinesses]) {
    if (r.error) {
      console.error("[admin] getAdminOverview count failed", {
        error: r.error.message,
      });
    }
  }

  return {
    pendingReviews: pendingReviews.count ?? 0,
    reportedReviews: reportedReviews.count ?? 0,
    pendingClaims: pendingClaims.count ?? 0,
    newBusinesses: newBusinesses.count ?? 0,
  };
}
