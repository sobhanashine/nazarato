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
