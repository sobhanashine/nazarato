import type {
  AspectId,
  IssueCluster,
  Sentiment,
} from "@/lib/intelligence/customer-voice-baseline";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const ASPECT_IDS: readonly AspectId[] = [
  "taste",
  "service",
  "value",
  "atmosphere",
  "cleanliness",
  "wait_time",
];

export const ISSUE_CLUSTER_IDS: readonly IssueCluster[] = [
  "taste_quality",
  "service_experience",
  "price_value",
  "atmosphere_comfort",
  "cleanliness_hygiene",
  "wait_time",
  "general_dissatisfaction",
];

const SENTIMENTS: readonly Sentiment[] = [
  "positive",
  "neutral",
  "mixed",
  "negative",
];

type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type CorrectionInput = {
  businessId: string;
  reviewId: string;
  sentiment: Sentiment;
  aspect: AspectId;
  issueCluster: IssueCluster | null;
  note: string;
};

export type ImprovementActionInput = {
  businessId: string;
  title: string;
  targetAspect: AspectId;
  targetIssueCluster: IssueCluster;
  targetReductionPct: number;
  followUpDate: string;
};

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function toTehranIsoDay(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    throw new Error("Tehran calendar date formatting failed");
  }
  return `${year}-${month}-${day}`;
}

export function parseCorrectionInput(
  formData: FormData,
): ParseResult<CorrectionInput> {
  const businessId = value(formData, "businessId");
  const reviewId = value(formData, "reviewId");
  const sentiment = value(formData, "sentiment");
  const aspect = value(formData, "aspect");
  const issueCluster = value(formData, "issueCluster");
  const note = value(formData, "note");

  if (!UUID.test(businessId) || !UUID.test(reviewId)) {
    return { ok: false, error: "شناسه کسب‌وکار یا نظر معتبر نیست." };
  }
  if (!SENTIMENTS.includes(sentiment as Sentiment)) {
    return { ok: false, error: "برچسب احساس معتبر نیست." };
  }
  if (!ASPECT_IDS.includes(aspect as AspectId)) {
    return { ok: false, error: "موضوع نظر معتبر نیست." };
  }
  if (
    issueCluster.length > 0 &&
    !ISSUE_CLUSTER_IDS.includes(issueCluster as IssueCluster)
  ) {
    return { ok: false, error: "دسته مسئله معتبر نیست." };
  }
  if (note.length > 500) {
    return { ok: false, error: "توضیح اصلاح نباید بیشتر از ۵۰۰ کاراکتر باشد." };
  }
  const hasNegativeSignal = sentiment === "negative" || sentiment === "mixed";
  if (hasNegativeSignal && issueCluster.length === 0) {
    return { ok: false, error: "برای بازخورد منفی، دسته مسئله را مشخص کن." };
  }

  return {
    ok: true,
    value: {
      businessId,
      reviewId,
      sentiment: sentiment as Sentiment,
      aspect: aspect as AspectId,
      issueCluster:
        hasNegativeSignal && issueCluster.length > 0
          ? (issueCluster as IssueCluster)
          : null,
      note,
    },
  };
}

export function parseImprovementActionInput(
  formData: FormData,
  now = new Date(),
): ParseResult<ImprovementActionInput> {
  const businessId = value(formData, "businessId");
  const title = value(formData, "title");
  const targetAspect = value(formData, "targetAspect");
  const targetIssueCluster = value(formData, "targetIssueCluster");
  const targetReductionPct = Number(value(formData, "targetReductionPct"));
  const followUpDate = value(formData, "followUpDate");

  if (!UUID.test(businessId)) {
    return { ok: false, error: "شناسه کسب‌وکار معتبر نیست." };
  }
  if (title.length < 5 || title.length > 160) {
    return { ok: false, error: "عنوان اقدام باید بین ۵ تا ۱۶۰ کاراکتر باشد." };
  }
  if (!ASPECT_IDS.includes(targetAspect as AspectId)) {
    return { ok: false, error: "موضوع اقدام معتبر نیست." };
  }
  if (!ISSUE_CLUSTER_IDS.includes(targetIssueCluster as IssueCluster)) {
    return { ok: false, error: "مسئله هدف معتبر نیست." };
  }
  if (!Number.isInteger(targetReductionPct) || targetReductionPct < 1 || targetReductionPct > 90) {
    return { ok: false, error: "هدف کاهش باید عددی بین ۱ تا ۹۰ درصد باشد." };
  }
  if (!ISO_DATE.test(followUpDate)) {
    return { ok: false, error: "تاریخ سنجش مجدد معتبر نیست." };
  }

  const today = toTehranIsoDay(now);
  const latest = toTehranIsoDay(
    new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
  );
  if (followUpDate <= today || followUpDate > latest) {
    return { ok: false, error: "تاریخ سنجش باید در ۱۸۰ روز آینده باشد." };
  }

  return {
    ok: true,
    value: {
      businessId,
      title,
      targetAspect: targetAspect as AspectId,
      targetIssueCluster: targetIssueCluster as IssueCluster,
      targetReductionPct,
      followUpDate,
    },
  };
}
