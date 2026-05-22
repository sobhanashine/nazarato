/**
 * `users` table access — phone-verified accounts (see
 * `supabase/migrations/0001_create_users_table.sql`).
 *
 * Auth is app-managed, so every call here runs server-side through the
 * service-role client. Never import this module into a Client Component.
 * Rows are validated at this boundary — the Supabase client is untyped, so
 * `asUserRow` is what makes the data trustworthy downstream.
 */
import { supabaseAdmin } from "@/lib/supabase/server";

export type UserRow = {
  id: string;
  phone: string;
  display_name: string;
  username: string | null;
  avatar_color: string | null;
  role: string;
};

const SELECT = "id, phone, display_name, username, avatar_color, role";

/** Avatar fallback palette — mirrors the per-user `color` used across the app. */
const AVATAR_COLORS = [
  "#5BBB7B",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#14B8A6",
  "#EF4444",
  "#A855F7",
];

/** Narrow an untrusted DB row to a `UserRow`; throws on an unexpected shape. */
function asUserRow(value: unknown): UserRow {
  if (typeof value !== "object" || value === null) {
    throw new Error("users: unexpected row shape");
  }
  const o = value as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.phone !== "string" ||
    typeof o.display_name !== "string" ||
    typeof o.role !== "string"
  ) {
    throw new Error("users: unexpected row shape");
  }
  return {
    id: o.id,
    phone: o.phone,
    display_name: o.display_name,
    username: typeof o.username === "string" ? o.username : null,
    avatar_color: typeof o.avatar_color === "string" ? o.avatar_color : null,
    role: o.role,
  };
}

/** Look up an account by canonical phone (`+989…`); `null` if none exists. */
export async function getUserByPhone(phone: string): Promise<UserRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .select(SELECT)
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.error("[users] getUserByPhone failed", {
      phone,
      error: error.message,
    });
    throw new Error("user lookup failed");
  }
  return data === null ? null : asUserRow(data);
}

/** A user row enriched for the profile dashboard (`/profile`). */
export type ProfileUser = {
  id: string;
  display_name: string;
  username: string | null;
  avatar_color: string | null;
  role: string;
  /** ISO timestamp — drives the "member since" line. */
  created_at: string;
  reviews_count?: number;
  helpful_votes_received?: number;
  reputation_score?: number;
};

const PROFILE_SELECT =
  "id, display_name, username, avatar_color, role, created_at, reviews_count, helpful_votes_received, reputation_score";

/** Narrow an untrusted DB row to a `ProfileUser`; throws on an unexpected shape. */
function asProfileUser(value: unknown): ProfileUser {
  if (typeof value !== "object" || value === null) {
    throw new Error("users: unexpected row shape");
  }
  const o = value as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.display_name !== "string" ||
    typeof o.role !== "string" ||
    typeof o.created_at !== "string"
  ) {
    throw new Error("users: unexpected row shape");
  }
  return {
    id: o.id,
    display_name: o.display_name,
    username: typeof o.username === "string" ? o.username : null,
    avatar_color: typeof o.avatar_color === "string" ? o.avatar_color : null,
    role: o.role,
    created_at: o.created_at,
    reviews_count: typeof o.reviews_count === "number" ? o.reviews_count : 0,
    helpful_votes_received: typeof o.helpful_votes_received === "number" ? o.helpful_votes_received : 0,
    reputation_score: typeof o.reputation_score === "number" ? o.reputation_score : 0,
  };
}

/** Look up an account by `id` (the session subject); `null` if the row is gone. */
export async function getUserById(id: string): Promise<ProfileUser | null> {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .select(PROFILE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[users] getUserById failed", { id, error: error.message });
    throw new Error("user lookup failed");
  }
  return data === null ? null : asProfileUser(data);
}

/**
 * Insert a new account. The caller must already hold a verified OTP challenge
 * for `phone` — this function does not re-check it.
 */
export async function createUser(input: {
  phone: string;
  displayName: string;
}): Promise<UserRow> {
  const color =
    AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const { data, error } = await supabaseAdmin()
    .from("users")
    .insert({
      phone: input.phone,
      display_name: input.displayName,
      avatar_color: color,
    })
    .select(SELECT)
    .single();

  if (error) {
    console.error("[users] createUser failed", {
      phone: input.phone,
      error: error.message,
    });
    throw new Error("user creation failed");
  }
  return asUserRow(data);
}
