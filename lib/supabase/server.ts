/**
 * Server-side Supabase client — uses the SERVICE-ROLE key, which bypasses RLS.
 *
 * The service-role key is a SECRET. This module must only ever be imported by
 * server code (Server Actions, Route Handlers, Server Components) — never by a
 * Client Component. Auth is app-managed (see `lib/auth/`), so Supabase is used
 * purely as the database here; this client carries no user session.
 */
import { createClient } from "@supabase/supabase-js";
import { IS_STAGING } from "@/lib/site";
import { assertStagingDatabaseIsolation } from "./staging-isolation";
import { databaseSchema } from "./environment";

function createServerClient(url: string, serviceKey: string) {
  return createClient(url, serviceKey, {
    db: { schema: databaseSchema(process.env, IS_STAGING) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type ServerDatabaseClient = ReturnType<typeof createServerClient>;
let client: ServerDatabaseClient | undefined;

/** Lazily-created, process-cached service-role client. */
export function supabaseAdmin(): ServerDatabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase env missing — set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  if (IS_STAGING || process.env.NAZARATO_DEPLOYMENT_ENV === "staging") {
    assertStagingDatabaseIsolation(
      url,
      process.env.NAZARATO_STAGING_SUPABASE_REF,
      process.env.NAZARATO_STAGING_DATABASE_MODE,
    );
  }
  if (client) return client;
  client = createServerClient(url, serviceKey);
  return client;
}
