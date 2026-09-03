"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  calculateNegativeBaseline,
} from "@/lib/data/owner-action-insights";
import {
  parseCorrectionInput,
  parseImprovementActionInput,
  toTehranIsoDay,
} from "@/lib/data/owner-action-input";
import { getOwnerDecisionWorkspace } from "@/lib/data/owner-decision-workspace";
import { assertOwnsBusiness } from "@/lib/data/owner";
import { ensurePersistedReviewAnalysis } from "@/lib/data/review-analysis-persistence";
import { CUSTOMER_VOICE_MODEL } from "@/lib/intelligence/customer-voice-baseline";
import { supabaseAdmin } from "@/lib/supabase/server";

export type InsightActionState = {
  status: "idle" | "ok" | "error";
  message?: string;
};

export async function submitAnalysisCorrection(
  _previous: InsightActionState,
  formData: FormData,
): Promise<InsightActionState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "ابتدا وارد حساب شو." };

  const parsed = parseCorrectionInput(formData);
  if (!parsed.ok) return { status: "error", message: parsed.error };
  const input = parsed.value;

  const business = await assertOwnsBusiness(session.id, input.businessId);
  if (!business) {
    return { status: "error", message: "این کسب‌وکار در دامنه‌ی شما نیست." };
  }

  const supabase = supabaseAdmin();
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("id, body, business_id, status")
    .eq("id", input.reviewId)
    .eq("business_id", business.id)
    .eq("status", "published")
    .maybeSingle();
  if (reviewError || !review) {
    if (reviewError) {
      console.error("[owner-insights] correction review lookup failed", {
        userId: session.id,
        businessId: business.id,
        reviewId: input.reviewId,
        error: reviewError.message,
      });
    }
    return { status: "error", message: "نظر منتشرشده پیدا نشد." };
  }

  try {
    const persisted = await ensurePersistedReviewAnalysis(
      input.reviewId,
      String(review.body),
    );
    const modelOutput = {
      sentiment: persisted.analysis.sentiment,
      aspectIds: Object.keys(persisted.analysis.aspectScores),
      issueCluster: persisted.analysis.issueCluster,
      model: {
        id: persisted.modelId,
        version: persisted.modelVersion,
      },
    };
    const humanLabel = {
      sentiment: input.sentiment,
      aspectIds: [input.aspect],
      issueCluster: input.issueCluster,
    };

    const { error: insertError } = await supabase
      .from("review_analysis_corrections")
      .insert({
        review_id: persisted.reviewId,
        model_id: persisted.modelId,
        model_version: persisted.modelVersion,
        reviewer_id: session.id,
        model_output: modelOutput,
        human_label: humanLabel,
        note: input.note,
      });
    if (insertError) throw new Error(insertError.message);

    const { error: statusError } = await supabase
      .from("review_analyses")
      .update({ human_status: "corrected", updated_at: new Date().toISOString() })
      .eq("review_id", persisted.reviewId)
      .eq("model_id", persisted.modelId)
      .eq("model_version", persisted.modelVersion);
    if (statusError) {
      console.error("[owner-insights] analysis status update failed", {
        userId: session.id,
        businessId: business.id,
        reviewId: persisted.reviewId,
        error: statusError.message,
      });
    }
  } catch (error) {
    console.error("[owner-insights] correction persistence failed", {
      userId: session.id,
      businessId: business.id,
      reviewId: input.reviewId,
      payloadShape: {
        sentiment: input.sentiment,
        aspect: input.aspect,
        hasIssueCluster: Boolean(input.issueCluster),
        noteLength: input.note.length,
      },
      error: error instanceof Error ? error.message : "unknown error",
    });
    return {
      status: "error",
      message: "ذخیره اصلاح فعلاً ممکن نیست؛ لایه ذخیره‌سازی تحلیل باید فعال باشد.",
    };
  }

  revalidatePath("/business/insights");
  return { status: "ok", message: "اصلاح شما بدون حذف خروجی قبلی ثبت شد." };
}

export async function createImprovementAction(
  _previous: InsightActionState,
  formData: FormData,
): Promise<InsightActionState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "ابتدا وارد حساب شو." };

  const now = new Date();
  const parsed = parseImprovementActionInput(formData, now);
  if (!parsed.ok) return { status: "error", message: parsed.error };
  const input = parsed.value;

  const business = await assertOwnsBusiness(session.id, input.businessId);
  if (!business) {
    return { status: "error", message: "این کسب‌وکار در دامنه‌ی شما نیست." };
  }

  const workspace = await getOwnerDecisionWorkspace(business.id);
  if (!workspace.actionStoreAvailable) {
    return {
      status: "error",
      message: "ثبت اقدام هنوز فعال نیست؛ لایه ذخیره‌سازی مربوط باید فعال شود.",
    };
  }
  if (!workspace.evidenceStoreAvailable) {
    return {
      status: "error",
      message: "ثبت اقدام تا دسترسی کامل به تحلیل‌ها و اصلاح‌ها متوقف است.",
    };
  }
  if (workspace.activeAction) {
    return {
      status: "error",
      message: "ابتدا اقدام فعال فعلی را به نتیجه برسان یا لغو کن.",
    };
  }
  if (workspace.livePreviewCount > 0) {
    return {
      status: "error",
      message: "پیش از ثبت اقدام، همه تحلیل‌های بازه باید نسخه‌دار و ذخیره شده باشند.",
    };
  }

  const supportedIssue = workspace.insights.issues.find(
    (issue) =>
      issue.aspect === input.targetAspect &&
      issue.issueCluster === input.targetIssueCluster,
  );
  if (!supportedIssue) {
    return {
      status: "error",
      message: "برای این مسئله هنوز شواهد مستقل کافی نداریم.",
    };
  }

  const baselineEnd = toTehranIsoDay(now);
  const baselineStart = toTehranIsoDay(
    new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000),
  );
  const baseline = calculateNegativeBaseline(
    workspace.reviews,
    input.targetAspect,
    { start: baselineStart, end: baselineEnd },
  );
  if (baseline.negativeMentions === 0) {
    return {
      status: "error",
      message: "در بازه ۹۰روزه شاهد منفی قابل‌اندازه‌گیری پیدا نشد.",
    };
  }

  const targetNegativeRate = Math.max(
    0,
    Math.round(
      baseline.negativeRate * (1 - input.targetReductionPct / 100) * 10_000,
    ) / 10_000,
  );
  const { error } = await supabaseAdmin()
    .from("business_improvement_actions")
    .insert({
      business_id: business.id,
      created_by: session.id,
      title: input.title,
      target_aspect: input.targetAspect,
      target_issue_cluster: input.targetIssueCluster,
      baseline_window_start: baselineStart,
      baseline_window_end: baselineEnd,
      baseline_review_count: baseline.reviewCount,
      baseline_negative_mentions: baseline.negativeMentions,
      baseline_negative_rate: baseline.negativeRate,
      target_reduction_pct: input.targetReductionPct,
      target_negative_rate: targetNegativeRate,
      follow_up_date: input.followUpDate,
      model_id: CUSTOMER_VOICE_MODEL.id,
      model_version: CUSTOMER_VOICE_MODEL.version,
      status: "active",
    });

  if (error) {
    console.error("[owner-insights] improvement action insert failed", {
      userId: session.id,
      businessId: business.id,
      payloadShape: {
        titleLength: input.title.length,
        targetAspect: input.targetAspect,
        targetIssueCluster: input.targetIssueCluster,
        targetReductionPct: input.targetReductionPct,
      },
      error: error.message,
    });
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "برای این کسب‌وکار از قبل یک اقدام فعال وجود دارد."
          : "ثبت اقدام ناموفق بود.",
    };
  }

  revalidatePath("/business/insights");
  revalidatePath("/business");
  return {
    status: "ok",
    message: "اقدام، خط پایه و هدف سنجش مجدد ثبت شدند.",
  };
}
