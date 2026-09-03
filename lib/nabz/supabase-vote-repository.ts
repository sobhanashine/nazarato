import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  ComparisonVoteRepository,
  ComparisonVoteRow,
} from "./vote-contract";

export class ComparisonVoteRepositoryError extends Error {
  constructor(public readonly stage: "eligibility" | "insert") {
    super(`Comparison vote repository failed during ${stage}.`);
    this.name = "ComparisonVoteRepositoryError";
  }
}

function idSet(rows: unknown): Set<string> {
  if (!Array.isArray(rows)) {
    return new Set();
  }

  return new Set(
    rows.flatMap((row) => {
      if (
        typeof row === "object" &&
        row !== null &&
        "id" in row &&
        typeof row.id === "string"
      ) {
        return [row.id];
      }
      return [];
    }),
  );
}

function businessIdSet(rows: unknown): Set<string> {
  if (!Array.isArray(rows)) {
    return new Set();
  }

  return new Set(
    rows.flatMap((row) => {
      if (
        typeof row === "object" &&
        row !== null &&
        "business_id" in row &&
        typeof row.business_id === "string"
      ) {
        return [row.business_id];
      }
      return [];
    }),
  );
}

export function createSupabaseComparisonVoteRepository(): ComparisonVoteRepository {
  return {
    async areBusinessesPublicationApproved(winnerBusinessId, loserBusinessId) {
      const businessIds = [winnerBusinessId, loserBusinessId];
      const supabase = supabaseAdmin();
      const { data: businesses, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .in("id", businessIds)
        .eq("status", "active");

      if (businessError) {
        throw new ComparisonVoteRepositoryError("eligibility");
      }

      const activeIds = idSet(businesses);
      if (activeIds.size !== 2 || businessIds.some((id) => !activeIds.has(id))) {
        return false;
      }

      const { data: sources, error: sourceError } = await supabase
        .from("business_sources")
        .select("business_id")
        .in("business_id", businessIds)
        .eq("status", "approved");

      if (sourceError) {
        throw new ComparisonVoteRepositoryError("eligibility");
      }

      const approvedSourceIds = businessIdSet(sources);
      return businessIds.every((id) => approvedSourceIds.has(id));
    },

    async insertVote(row: ComparisonVoteRow) {
      const { error } = await supabaseAdmin()
        .from("comparison_votes")
        .insert(row);

      if (!error) {
        return "inserted";
      }
      if (error.code === "23505") {
        return "duplicate";
      }

      throw new ComparisonVoteRepositoryError("insert");
    },
  };
}
