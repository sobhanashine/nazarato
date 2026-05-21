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
