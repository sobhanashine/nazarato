/**
 * Server-only Supabase adapter for the source-aware business importer.
 * Existing businesses are never overwritten by an import; a new approved
 * source is retained as provenance and owner edits stay canonical.
 */
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../supabase/server.ts";
import {
  executeBusinessImport,
  type BusinessImportRepository,
  type ExecuteBusinessImportResult,
  type PreparedBusinessRow,
  type PreparedBusinessSourceRow,
} from "./business-import.ts";

function failImport(
  stage: string,
  context: Record<string, string>,
  error: PostgrestError,
): never {
  console.error("Business import persistence failed", {
    stage,
    ...context,
    code: error.code,
    message: error.message,
  });
  throw new Error(`Business import failed during ${stage}.`);
}

export function createSupabaseBusinessImportRepository(
  client: SupabaseClient,
): BusinessImportRepository {
  return {
    async upsertBusiness(business: PreparedBusinessRow) {
      // Fail closed: source persistence happens after this call. A brand-new
      // profile cannot become public until markBusinessPublishable succeeds.
      const pendingBusiness = { ...business, status: "pending" as const };
      const { data, error } = await client
        .from("businesses")
        .upsert(pendingBusiness, { onConflict: "slug", ignoreDuplicates: true })
        .select("id")
        .maybeSingle();

      if (error) failImport("business-upsert", { slug: business.slug }, error);
      if (data) return { id: String(data.id), created: true };

      const { data: existing, error: lookupError } = await client
        .from("businesses")
        .select("id")
        .eq("slug", business.slug)
        .single();
      if (lookupError) failImport("business-lookup", { slug: business.slug }, lookupError);
      return { id: String(existing.id), created: false };
    },

    async upsertSource(
      source: PreparedBusinessSourceRow & { business_id: string },
    ) {
      const { data, error } = await client
        .from("business_sources")
        .upsert(source, {
          onConflict: "business_id,payload_hash",
          ignoreDuplicates: true,
        })
        .select("id")
        .maybeSingle();

      const context = {
        businessId: source.business_id,
        payloadHash: source.payload_hash,
      };
      if (error) failImport("source-upsert", context, error);
      if (data) return { id: String(data.id), created: true };

      const { data: existing, error: lookupError } = await client
        .from("business_sources")
        .select("id")
        .eq("business_id", source.business_id)
        .eq("payload_hash", source.payload_hash)
        .single();
      if (lookupError) failImport("source-lookup", context, lookupError);
      return { id: String(existing.id), created: false };
    },

    async markBusinessPublishable(businessId: string) {
      const { error } = await client
        .from("businesses")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", businessId)
        .eq("status", "pending");
      if (error) failImport("business-publish", { businessId }, error);
    },
  };
}

/** Entry point for a future admin importer or reviewed ingestion job. */
export async function importBusinessWithSupabase(
  input: unknown,
): Promise<ExecuteBusinessImportResult> {
  return executeBusinessImport(
    input,
    createSupabaseBusinessImportRepository(supabaseAdmin()),
  );
}
