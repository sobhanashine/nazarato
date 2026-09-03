import {
  analyzePersianCustomerVoice,
  CUSTOMER_VOICE_MODEL,
  type AspectId,
  type AspectScore,
  type EvidenceSpan,
  type IssueCluster,
  type Sentiment,
} from "@/lib/intelligence/customer-voice-baseline";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  buildOwnerActionInsights,
  type OwnerActionInsights,
  type OwnerAnalyzedReview,
  type OwnerCorrection,
} from "./owner-action-insights";

type ReviewRow = {
  id: string;
  body: string;
  created_at: string;
  rating: number;
};

type AnalysisRow = {
  review_id: string;
  model_id: string;
  model_version: string;
  sentiment: string;
  aspect_scores: unknown;
  evidence_spans: unknown;
  issue_cluster: string | null;
  confidence: number;
  human_status: string;
};

type CorrectionRow = {
  review_id: string;
  human_label: unknown;
  corrected_at: string;
};

export type OwnerImprovementAction = {
  id: string;
  title: string;
  targetAspect: AspectId;
  targetIssueCluster: IssueCluster;
  baselineReviewCount: number;
  baselineNegativeMentions: number;
  baselineNegativeRate: number;
  targetReductionPct: number;
  targetNegativeRate: number;
  baselineWindowStart: string;
  baselineWindowEnd: string;
  followUpDate: string;
  modelId: string;
  modelVersion: string;
  status: "planned" | "active" | "completed" | "cancelled";
};

export type CorrectionChoice = {
  id: string;
  excerpt: string;
  sentiment: Sentiment;
  aspectIds: AspectId[];
  issueCluster: IssueCluster | null;
  corrected: boolean;
};

export type OwnerDecisionWorkspace = {
  insights: OwnerActionInsights;
  reviews: OwnerAnalyzedReview[];
  correctionChoices: CorrectionChoice[];
  activeAction: OwnerImprovementAction | null;
  actionStoreAvailable: boolean;
  evidenceStoreAvailable: boolean;
  persistedAnalysisCount: number;
  livePreviewCount: number;
};

const ASPECTS = new Set<AspectId>([
  "taste",
  "service",
  "value",
  "atmosphere",
  "cleanliness",
  "wait_time",
]);
const SENTIMENTS = new Set<Sentiment>([
  "positive",
  "neutral",
  "mixed",
  "negative",
]);
const ISSUE_CLUSTERS = new Set<IssueCluster>([
  "taste_quality",
  "service_experience",
  "price_value",
  "atmosphere_comfort",
  "cleanliness_hygiene",
  "wait_time",
  "general_dissatisfaction",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAspect(value: unknown): value is AspectId {
  return typeof value === "string" && ASPECTS.has(value as AspectId);
}

function isSentiment(value: unknown): value is Sentiment {
  return typeof value === "string" && SENTIMENTS.has(value as Sentiment);
}

function isIssueCluster(value: unknown): value is IssueCluster {
  return typeof value === "string" && ISSUE_CLUSTERS.has(value as IssueCluster);
}

function parseAspectScores(value: unknown): Partial<Record<AspectId, AspectScore>> {
  if (!isRecord(value)) return {};
  const parsed: Partial<Record<AspectId, AspectScore>> = {};
  for (const [key, score] of Object.entries(value)) {
    if (!isAspect(key) || !isRecord(score)) continue;
    const mentions = Number(score.mentions);
    const positive = Number(score.positive);
    const negative = Number(score.negative);
    const net = Number(score.net);
    const confidence = Number(score.confidence);
    if ([mentions, positive, negative, net, confidence].every(Number.isFinite)) {
      parsed[key] = { mentions, positive, negative, net, confidence };
    }
  }
  return parsed;
}

function parseEvidenceSpans(value: unknown): EvidenceSpan[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): EvidenceSpan[] => {
    if (!isRecord(item)) return [];
    const polarity = item.polarity;
    const aspect = item.aspect;
    if (
      !(isAspect(aspect) || aspect === "overall") ||
      (polarity !== "positive" && polarity !== "negative" && polarity !== "neutral") ||
      typeof item.start !== "number" ||
      typeof item.end !== "number" ||
      typeof item.excerpt !== "string" ||
      typeof item.cue !== "string"
    ) {
      return [];
    }
    return [{
      aspect,
      polarity,
      start: item.start,
      end: item.end,
      excerpt: item.excerpt,
      cue: item.cue,
    }];
  });
}

function parseCorrection(row: CorrectionRow): OwnerCorrection | null {
  if (!isRecord(row.human_label)) return null;
  const sentiment = row.human_label.sentiment;
  const rawAspects = row.human_label.aspectIds;
  const issueCluster = row.human_label.issueCluster;
  if (!isSentiment(sentiment) || !Array.isArray(rawAspects)) return null;
  const aspectIds = rawAspects.filter(isAspect);
  if (aspectIds.length === 0) return null;
  if (issueCluster !== null && !isIssueCluster(issueCluster)) return null;
  return {
    sentiment,
    aspectIds,
    issueCluster,
    correctedAt: row.corrected_at,
  };
}

function persistedAnalysis(
  review: ReviewRow,
  row: AnalysisRow,
  latestCorrection: OwnerCorrection | null,
): OwnerAnalyzedReview | null {
  if (!isSentiment(row.sentiment)) return null;
  const humanStatus = row.human_status;
  if (
    humanStatus !== "unreviewed" &&
    humanStatus !== "confirmed" &&
    humanStatus !== "corrected" &&
    humanStatus !== "rejected"
  ) return null;
  const issueCluster = row.issue_cluster;
  if (issueCluster !== null && !isIssueCluster(issueCluster)) return null;

  return {
    id: review.id,
    body: review.body,
    createdAt: review.created_at,
    rating: review.rating,
    analysis: {
      modelId: row.model_id,
      modelVersion: row.model_version,
      sentiment: row.sentiment,
      aspectScores: parseAspectScores(row.aspect_scores),
      evidenceSpans: parseEvidenceSpans(row.evidence_spans),
      issueCluster,
      confidence: Number(row.confidence) || 0,
      humanStatus,
    },
    latestCorrection,
  };
}

function liveAnalysis(review: ReviewRow): OwnerAnalyzedReview {
  const analysis = analyzePersianCustomerVoice(review.body);
  return {
    id: review.id,
    body: review.body,
    createdAt: review.created_at,
    rating: review.rating,
    analysis: {
      modelId: analysis.model.id,
      modelVersion: analysis.model.version,
      sentiment: analysis.sentiment,
      aspectScores: analysis.aspectScores,
      evidenceSpans: analysis.evidenceSpans,
      issueCluster: analysis.issueCluster,
      confidence: analysis.confidence,
      humanStatus: "unreviewed",
    },
    latestCorrection: null,
  };
}

function mapAction(value: Record<string, unknown>): OwnerImprovementAction | null {
  const targetAspect = value.target_aspect;
  const targetIssueCluster = value.target_issue_cluster;
  const status = value.status;
  if (
    !isAspect(targetAspect) ||
    !isIssueCluster(targetIssueCluster) ||
    (status !== "planned" && status !== "active" && status !== "completed" && status !== "cancelled")
  ) return null;
  return {
    id: String(value.id),
    title: String(value.title),
    targetAspect,
    targetIssueCluster,
    baselineReviewCount: Number(value.baseline_review_count),
    baselineNegativeMentions: Number(value.baseline_negative_mentions),
    baselineNegativeRate: Number(value.baseline_negative_rate),
    targetReductionPct: Number(value.target_reduction_pct),
    targetNegativeRate: Number(value.target_negative_rate),
    baselineWindowStart: String(value.baseline_window_start),
    baselineWindowEnd: String(value.baseline_window_end),
    followUpDate: String(value.follow_up_date),
    modelId: String(value.model_id),
    modelVersion: String(value.model_version),
    status,
  };
}

export async function getOwnerDecisionWorkspace(
  businessId: string,
): Promise<OwnerDecisionWorkspace> {
  const supabase = supabaseAdmin();
  const { data: reviewData, error: reviewError } = await supabase
    .from("reviews")
    .select("id, body, created_at, rating")
    .eq("business_id", businessId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (reviewError) {
    console.error("[owner-decisions] review lookup failed", {
      businessId,
      error: reviewError.message,
    });
    throw new Error("owner decision review lookup failed");
  }

  const reviews = (reviewData ?? []) as ReviewRow[];
  const reviewIds = reviews.map((review) => review.id);
  let analyses: AnalysisRow[] = [];
  let corrections: CorrectionRow[] = [];
  let evidenceStoreAvailable = true;

  if (reviewIds.length > 0) {
    const analysisResult = await supabase
      .from("review_analyses")
      .select("review_id, model_id, model_version, sentiment, aspect_scores, evidence_spans, issue_cluster, confidence, human_status")
      .in("review_id", reviewIds)
      .eq("model_id", CUSTOMER_VOICE_MODEL.id)
      .eq("model_version", CUSTOMER_VOICE_MODEL.version)
      .eq("is_active", true);
    if (analysisResult.error) {
      evidenceStoreAvailable = false;
      console.warn("[owner-decisions] persisted analyses unavailable; using live preview", {
        businessId,
        error: analysisResult.error.message,
      });
    } else {
      analyses = (analysisResult.data ?? []) as AnalysisRow[];
      const correctionResult = await supabase
        .from("review_analysis_corrections")
        .select("review_id, human_label, corrected_at")
        .in("review_id", reviewIds)
        .eq("model_id", CUSTOMER_VOICE_MODEL.id)
        .eq("model_version", CUSTOMER_VOICE_MODEL.version)
        .order("corrected_at", { ascending: false });
      if (correctionResult.error) {
        evidenceStoreAvailable = false;
        console.warn("[owner-decisions] corrections unavailable", {
          businessId,
          error: correctionResult.error.message,
        });
      } else {
        corrections = (correctionResult.data ?? []) as CorrectionRow[];
      }
    }
  }

  const analysisByReview = new Map(analyses.map((row) => [row.review_id, row]));
  const correctionByReview = new Map<string, OwnerCorrection>();
  for (const row of corrections) {
    if (correctionByReview.has(row.review_id)) continue;
    const parsed = parseCorrection(row);
    if (parsed) correctionByReview.set(row.review_id, parsed);
  }

  let persistedAnalysisCount = 0;
  const analyzedReviews = reviews.map((review) => {
    const row = analysisByReview.get(review.id);
    const persisted = row
      ? persistedAnalysis(review, row, correctionByReview.get(review.id) ?? null)
      : null;
    if (persisted) {
      persistedAnalysisCount += 1;
      return persisted;
    }
    return liveAnalysis(review);
  });

  const actionResult = await supabase
    .from("business_improvement_actions")
    .select("id, title, target_aspect, target_issue_cluster, baseline_window_start, baseline_window_end, baseline_review_count, baseline_negative_mentions, baseline_negative_rate, target_reduction_pct, target_negative_rate, follow_up_date, model_id, model_version, status")
    .eq("business_id", businessId)
    .in("status", ["planned", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const actionStoreAvailable = !actionResult.error;
  if (actionResult.error) {
    console.warn("[owner-decisions] improvement action store unavailable", {
      businessId,
      error: actionResult.error.message,
    });
  }

  return {
    insights: buildOwnerActionInsights(analyzedReviews),
    reviews: analyzedReviews,
    correctionChoices: analyzedReviews.slice(0, 12).map((review) => ({
      id: review.id,
      excerpt: review.body.length > 140 ? `${review.body.slice(0, 137)}…` : review.body,
      sentiment: review.latestCorrection?.sentiment ?? review.analysis.sentiment,
      aspectIds:
        review.latestCorrection?.aspectIds ??
        (Object.keys(review.analysis.aspectScores) as AspectId[]),
      issueCluster:
        review.latestCorrection?.issueCluster ?? review.analysis.issueCluster,
      corrected: Boolean(review.latestCorrection),
    })),
    activeAction:
      actionResult.data && isRecord(actionResult.data)
        ? mapAction(actionResult.data)
        : null,
    actionStoreAvailable,
    evidenceStoreAvailable,
    persistedAnalysisCount,
    livePreviewCount: analyzedReviews.length - persistedAnalysisCount,
  };
}
