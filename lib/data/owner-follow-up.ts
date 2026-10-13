import { CUSTOMER_VOICE_MODEL } from "@/lib/intelligence/customer-voice-baseline";
import { calculateNegativeBaseline, type OwnerAnalyzedReview } from "./owner-action-insights";
import { toTehranIsoDay } from "./owner-action-input";

export const OWNER_METRIC_VERSION = "qualified-review-rate/1";
export type FollowUpAction = { baselineWindowEnd: string; followUpDate: string; targetAspect: Parameters<typeof calculateNegativeBaseline>[1]; modelId: string; modelVersion: string; metricVersion: string | null; baselineNegativeRate: number; targetNegativeRate: number };
export type FollowUpResult = { ok: false; message: string } | { ok: true; windowStart: string; windowEnd: string; reviewCount: number; negativeMentions: number; negativeRate: number; targetMet: boolean; measuredAt: string };

/** A reproducible observation, not a causal estimate of the owner's effect. */
export function measureOwnerFollowUp(action: FollowUpAction, reviews: readonly OwnerAnalyzedReview[], now = new Date()): FollowUpResult {
  if (action.modelId !== CUSTOMER_VOICE_MODEL.id || action.modelVersion !== CUSTOMER_VOICE_MODEL.version || action.metricVersion !== OWNER_METRIC_VERSION) return { ok:false,message:"نسخهٔ تحلیل یا معیار خط پایه متفاوت است؛ این اقدام به سنجش قابل‌مقایسه نیاز دارد." };
  const startDate = new Date(`${action.baselineWindowEnd}T12:00:00Z`);
  const endDate = new Date(`${action.followUpDate}T12:00:00Z`);
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate) return {ok:false,message:"بازهٔ اقدام معتبر نیست."};
  if (toTehranIsoDay(now) < action.followUpDate) return {ok:false,message:"تاریخ سنجش هنوز نرسیده است؛ اقدام فعال می‌ماند."};
  startDate.setUTCDate(startDate.getUTCDate()+1);
  const windowStart = startDate.toISOString().slice(0,10);
  const metric = calculateNegativeBaseline(reviews,action.targetAspect,{start:windowStart,end:action.followUpDate});
  if (metric.reviewCount < 3) return {ok:false,message:"داده کافی نداریم؛ حداقل سه تجربهٔ معتبر در بازهٔ بعد لازم است. اقدام فعال می‌ماند."};
  return {ok:true,windowStart,windowEnd:action.followUpDate,...metric,targetMet:metric.negativeRate <= action.targetNegativeRate,measuredAt:now.toISOString()};
}
