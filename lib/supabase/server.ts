/**
 * Server-side Supabase client — uses the SERVICE-ROLE key, which bypasses RLS.
 *
 * The service-role key is a SECRET. This module must only ever be imported by
 * server code (Server Actions, Route Handlers, Server Components) — never by a
 * Client Component. Auth is app-managed (see `lib/auth/`), so Supabase is used
 * purely as the database here; this client carries no user session.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

/** Lazily-created, process-cached service-role client. */
export function supabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase env missing — set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
