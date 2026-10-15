import {
  analyzePersianCustomerVoice,
  CUSTOMER_VOICE_MODEL,
  type CustomerVoiceAnalysis,
} from "@/lib/intelligence/customer-voice-baseline";
import { supabaseAdmin } from "@/lib/supabase/server";

export type PersistedAnalysisIdentity = {
  reviewId: string;
  modelId: string;
  modelVersion: string;
  analysis: CustomerVoiceAnalysis;
};

export function toReviewAnalysisRow(
  reviewId: string,
  analysis: CustomerVoiceAnalysis,
) {
  return {
    review_id: reviewId,
    model_id: analysis.model.id,
    model_version: analysis.model.version,
    normalized_text: analysis.normalizedText,
    aspect_scores: analysis.aspectScores,
    sentiment: analysis.sentiment,
    evidence_spans: analysis.evidenceSpans,
    issue_cluster: analysis.issueCluster,
    suspicious_score: analysis.suspiciousScore,
    confidence: analysis.confidence,
    human_status: "unreviewed",
    is_active: true,
    analyzed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Makes the current deterministic model result durable before a correction is
 * appended. Existing human-reviewed rows are never overwritten.
 */
export async function ensurePersistedReviewAnalysis(
  reviewId: string,
  body: string,
): Promise<PersistedAnalysisIdentity> {
  const supabase = supabaseAdmin();
  const { data: existing, error: lookupError } = await supabase
    .from("review_analyses")
    .select("review_id, model_id, model_version, human_status, is_active")
    .eq("review_id", reviewId)
    .eq("model_id", CUSTOMER_VOICE_MODEL.id)
    .eq("model_version", CUSTOMER_VOICE_MODEL.version)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`analysis lookup failed: ${lookupError.message}`);
  }

  const analysis = analyzePersianCustomerVoice(body);
  if (!existing) {
    // Preserve a previous active model if inserting this version fails. Model
    // transitions need a dedicated transactional migration, not two writes.
    const { error: insertError } = await supabase
      .from("review_analyses")
      .insert(toReviewAnalysisRow(reviewId, analysis));
    if (insertError) {
      throw new Error(`analysis insert failed: ${insertError.message}`);
    }
  } else if (!existing.is_active) {
    throw new Error("current model exists but is inactive; transactional model transition required");
  }

  return {
    reviewId,
    modelId: CUSTOMER_VOICE_MODEL.id,
    modelVersion: CUSTOMER_VOICE_MODEL.version,
    analysis,
  };
}

/** Publishing must not fail only because the optional intelligence layer is unavailable. */
export async function persistReviewAnalysisBestEffort(
  reviewId: string,
  body: string,
): Promise<boolean> {
  try {
    await ensurePersistedReviewAnalysis(reviewId, body);
    return true;
  } catch (error) {
    console.error("[review-analysis] persistence failed", {
      reviewId,
      modelId: CUSTOMER_VOICE_MODEL.id,
      modelVersion: CUSTOMER_VOICE_MODEL.version,
      error: error instanceof Error ? error.message : "unknown error",
    });
    return false;
  }
}
