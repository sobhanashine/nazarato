import { supabaseAdmin } from "@/lib/supabase/server";
import { CUSTOMER_VOICE_MODEL } from "@/lib/intelligence/customer-voice-baseline";
import { REAL_TASTE_MODEL, parseRealTasteProfile, type RealChoice, type RealTasteProfile } from "./real-recommendation";
import type { ComparisonScenario } from "./vote-contract";

export async function getOwnRealChoices(identity: { userId: string } | { anonymousId: string }, scenario: ComparisonScenario, now = new Date()): Promise<RealChoice[]> {
  let query = supabaseAdmin().from("comparison_votes").select("winner_business_id,loser_business_id")
    .eq("city_slug", "rasht").eq("scenario_slug", scenario).eq("moderation_status", "accepted").gt("weight", 0)
    .eq("vote_window", now.toISOString().slice(0,10));
  query = "userId" in identity ? query.eq("user_id", identity.userId) : query.eq("anonymous_session_id", identity.anonymousId);
  const {data,error} = await query.order("created_at",{ascending:false}).limit(5);
  if (error) throw new Error("own comparison evidence unavailable");
  return (data ?? []).flatMap(row => typeof row.winner_business_id === "string" && typeof row.loser_business_id === "string" ? [{winnerId:row.winner_business_id,loserId:row.loser_business_id}] : []);
}

export async function getRealReviewEvidence(businessIds: readonly string[], now = new Date()): Promise<unknown> {
  if (!businessIds.length) return [];
  const {data,error} = await supabaseAdmin().from("reviews")
    .select("id,author_id,business_id,status,origin_kind,body,created_at,review_analyses!inner(model_id,model_version,is_active,human_status,confidence,suspicious_score,aspect_scores,evidence_spans)")
    .in("business_id",businessIds).eq("status","published").eq("origin_kind","first_party")
    .eq("review_analyses.model_id",CUSTOMER_VOICE_MODEL.id).eq("review_analyses.model_version",CUSTOMER_VOICE_MODEL.version)
    .eq("review_analyses.is_active",true).in("review_analyses.human_status",["unreviewed","confirmed"])
    .gte("created_at",new Date(now.getTime()-180*86_400_000).toISOString())
    .order("created_at",{ascending:false}).limit(5000);
  if (error) throw new Error("recommendation evidence unavailable");
  return data;
}

export async function saveRealTaste(userId: string, profile: RealTasteProfile): Promise<void> {
  const {error} = await supabaseAdmin().rpc("save_real_taste_profile", { p_user_id:userId, p_profile:profile });
  if (error) throw new Error("private taste save unavailable");
}

export async function loadRealTaste(userId: string): Promise<RealTasteProfile | null> {
  const {data,error} = await supabaseAdmin().from("taste_profiles").select("dimension_weights")
    .eq("user_id",userId).eq("model_id",REAL_TASTE_MODEL.id).eq("model_version",REAL_TASTE_MODEL.version).eq("is_active",true).maybeSingle();
  if (error) throw new Error("private taste read unavailable");
  if (!data) return null;
  const profile = parseRealTasteProfile(data.dimension_weights);
  if (!profile) throw new Error("private taste shape invalid");
  return profile;
}
