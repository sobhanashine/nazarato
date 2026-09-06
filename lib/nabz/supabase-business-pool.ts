import { CUSTOMER_VOICE_MODEL } from "../intelligence/customer-voice-baseline.ts";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  loadNabzBusinessPool,
  type NabzBusinessPoolLoadResult,
  type NabzBusinessPoolRepository,
} from "./business-pool";

const MAX_POOL_BUSINESSES = 100;
const MAX_SIGNAL_ROWS = 5_000;

class NabzBusinessPoolRepositoryError extends Error {
  constructor(stage: "businesses" | "votes" | "reviews", message: string) {
    super(`Nabz business pool ${stage} read failed: ${message}`);
    this.name = "NabzBusinessPoolRepositoryError";
  }
}

function createSupabaseNabzBusinessPoolRepository(): NabzBusinessPoolRepository {
  return {
    async listBusinesses() {
      const { data, error } = await supabaseAdmin()
        .from("businesses")
        .select(
          `
            id,
            slug,
            name,
            category_slug,
            city,
            status,
            neighborhood_slug,
            latitude,
            longitude,
            price_band,
            contact,
            business_sources!inner (
              status,
              field_payload
            )
          `,
        )
        .eq("status", "active")
        .eq("city", "رشت")
        .in("category_slug", ["cafe", "restaurant"])
        .eq("business_sources.status", "approved")
        .limit(MAX_POOL_BUSINESSES);

      if (error) {
        throw new NabzBusinessPoolRepositoryError(
          "businesses",
          error.message,
        );
      }
      return data;
    },

    async listAcceptedVotes(businessIds) {
      const { data, error } = await supabaseAdmin()
        .from("comparison_votes")
        .select(
          "winner_business_id,loser_business_id,weight,moderation_status",
        )
        .eq("city_slug", "rasht")
        .eq("moderation_status", "accepted")
        .limit(MAX_SIGNAL_ROWS);

      if (error) {
        throw new NabzBusinessPoolRepositoryError("votes", error.message);
      }

      const ids = new Set(businessIds);
      return Array.isArray(data)
        ? data.filter(
            (row) =>
              typeof row === "object" &&
              row !== null &&
              "winner_business_id" in row &&
              "loser_business_id" in row &&
              typeof row.winner_business_id === "string" &&
              typeof row.loser_business_id === "string" &&
              ids.has(row.winner_business_id) &&
              ids.has(row.loser_business_id),
          )
        : data;
    },

    async listReviewEvidence(businessIds) {
      const { data, error } = await supabaseAdmin()
        .from("reviews")
        .select(
          `
            business_id,
            review_analyses!inner (
              confidence,
              human_status,
              is_active,
              model_id,
              model_version
            )
          `,
        )
        .in("business_id", businessIds)
        .eq("status", "published")
        .eq("review_analyses.is_active", true)
        .eq("review_analyses.model_id", CUSTOMER_VOICE_MODEL.id)
        .eq("review_analyses.model_version", CUSTOMER_VOICE_MODEL.version)
        .neq("review_analyses.human_status", "rejected")
        .gte("review_analyses.confidence", 0.55)
        .limit(MAX_SIGNAL_ROWS);

      if (error) {
        throw new NabzBusinessPoolRepositoryError("reviews", error.message);
      }
      return data;
    },
  };
}

/** Server-only entry point for the homepage's real-data readiness indicator. */
export function getSupabaseNabzBusinessPool(): Promise<NabzBusinessPoolLoadResult> {
  return loadNabzBusinessPool(createSupabaseNabzBusinessPoolRepository());
}
