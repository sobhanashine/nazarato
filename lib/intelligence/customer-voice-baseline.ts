import { normalizePersianText } from "./persian-normalizer.ts";

export const CUSTOMER_VOICE_MODEL = {
  id: "nazarato-fa-rules",
  version: "0.1.0",
} as const;

export type Sentiment = "positive" | "neutral" | "mixed" | "negative";

export type AspectId =
  | "taste"
  | "service"
  | "value"
  | "atmosphere"
  | "cleanliness"
  | "wait_time";

export type IssueCluster =
  | "taste_quality"
  | "service_experience"
  | "price_value"
  | "atmosphere_comfort"
  | "cleanliness_hygiene"
  | "wait_time"
  | "general_dissatisfaction";

export type EvidenceSpan = {
  aspect: AspectId | "overall";
  polarity: "positive" | "negative" | "neutral";
  start: number;
  end: number;
  excerpt: string;
  cue: string;
};

export type AspectScore = {
  mentions: number;
  positive: number;
  negative: number;
  net: number;
  confidence: number;
};

export type CustomerVoiceAnalysis = {
  model: typeof CUSTOMER_VOICE_MODEL;
  normalizedText: string;
  offsetBasis: "normalized_text_utf16";
  sentiment: Sentiment;
  aspectScores: Partial<Record<AspectId, AspectScore>>;
  evidenceSpans: EvidenceSpan[];
  issueCluster: IssueCluster | null;
  suspiciousScore: number;
  confidence: number;
  moderation: {
    status: "clear" | "needs_human_review";
    reasons: SuspiciousReason[];
  };
};

type CueRule = {
  cue: string;
  polarity: Exclude<EvidenceSpan["polarity"], "neutral">;
  weight: number;
  aspect?: AspectId;
};

type SuspiciousReason =
  | "contact_or_link"
  | "excessive_punctuation"
  | "repeated_character"
  | "repeated_word";

type MutableAspectScore = {
  positive: number;
  negative: number;
};

const UNSORTED_CUE_RULES: readonly CueRule[] = [
  { cue: "قیمت مناسب نبود", polarity: "negative", weight: 2.2, aspect: "value" },
  { cue: "برخورد خوب نبود", polarity: "negative", weight: 2.2, aspect: "service" },
  { cue: "راضی نبودم", polarity: "negative", weight: 2.1 },
  { cue: "ارزش نداشت", polarity: "negative", weight: 2.1, aspect: "value" },
  { cue: "خیلی دیر", polarity: "negative", weight: 2.1, aspect: "wait_time" },
  { cue: "اصلا خوب نبود", polarity: "negative", weight: 2 },
  { cue: "خوب نبود", polarity: "negative", weight: 1.8 },
  { cue: "بد نبود", polarity: "positive", weight: 1.2 },
  { cue: "ارزش داشت", polarity: "positive", weight: 1.8, aspect: "value" },
  { cue: "راضی بودم", polarity: "positive", weight: 1.8 },
  { cue: "خیلی خوب", polarity: "positive", weight: 1.7 },
  { cue: "بی‌کیفیت", polarity: "negative", weight: 1.8, aspect: "taste" },
  { cue: "بی کیفیت", polarity: "negative", weight: 1.8, aspect: "taste" },
  { cue: "بی‌ادب", polarity: "negative", weight: 1.8, aspect: "service" },
  { cue: "بی ادب", polarity: "negative", weight: 1.8, aspect: "service" },
  { cue: "بی‌مزه", polarity: "negative", weight: 1.7, aspect: "taste" },
  { cue: "بی مزه", polarity: "negative", weight: 1.7, aspect: "taste" },
  { cue: "خوشمزه", polarity: "positive", weight: 1.7, aspect: "taste" },
  { cue: "اقتصادی", polarity: "positive", weight: 1.5, aspect: "value" },
  { cue: "افتضاح", polarity: "negative", weight: 2 },
  { cue: "کثیف", polarity: "negative", weight: 1.8, aspect: "cleanliness" },
  { cue: "تمیز", polarity: "positive", weight: 1.5, aspect: "cleanliness" },
  { cue: "گرون", polarity: "negative", weight: 1.5, aspect: "value" },
  { cue: "گران", polarity: "negative", weight: 1.5, aspect: "value" },
  { cue: "معطل", polarity: "negative", weight: 1.8, aspect: "wait_time" },
  { cue: "سریع", polarity: "positive", weight: 1.5, aspect: "wait_time" },
  { cue: "شلوغ", polarity: "negative", weight: 1.2, aspect: "atmosphere" },
  { cue: "آرام", polarity: "positive", weight: 1.3, aspect: "atmosphere" },
  { cue: "دنج", polarity: "positive", weight: 1.5, aspect: "atmosphere" },
  { cue: "شور", polarity: "negative", weight: 1.5, aspect: "taste" },
  { cue: "سرد", polarity: "negative", weight: 1.3, aspect: "taste" },
  { cue: "کند", polarity: "negative", weight: 1.4, aspect: "wait_time" },
  { cue: "دیر", polarity: "negative", weight: 1.5, aspect: "wait_time" },
  { cue: "عالی", polarity: "positive", weight: 2 },
  { cue: "خوب", polarity: "positive", weight: 1.2 },
  { cue: "بد", polarity: "negative", weight: 1.2 },
];

const CUE_RULES = [...UNSORTED_CUE_RULES].sort(
  (left, right) => right.cue.length - left.cue.length,
);

const ASPECT_KEYWORDS: Readonly<Record<AspectId, readonly string[]>> = {
  taste: ["طعم", "مزه", "غذا", "قهوه", "نوشیدنی"],
  service: ["برخورد", "پرسنل", "سرویس", "پاسخ"],
  value: ["قیمت", "هزینه", "ارزش"],
  atmosphere: ["فضا", "محیط", "موسیقی"],
  cleanliness: ["بهداشت", "نظافت"],
  wait_time: ["انتظار", "زمان"],
};

const ISSUE_CLUSTERS: Readonly<Record<AspectId, IssueCluster>> = {
  taste: "taste_quality",
  service: "service_experience",
  value: "price_value",
  atmosphere: "atmosphere_comfort",
  cleanliness: "cleanliness_hygiene",
  wait_time: "wait_time",
};

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function rangesOverlap(
  start: number,
  end: number,
  occupied: readonly { start: number; end: number }[],
): boolean {
  return occupied.some((range) => start < range.end && end > range.start);
}

function inferNearbyAspect(
  text: string,
  evidenceStart: number,
  evidenceEnd: number,
): AspectId | "overall" {
  let nearest: { aspect: AspectId; distance: number } | null = null;

  for (const [aspect, keywords] of Object.entries(ASPECT_KEYWORDS) as [
    AspectId,
    readonly string[],
  ][]) {
    for (const keyword of keywords) {
      let keywordStart = text.indexOf(keyword);
      while (keywordStart >= 0) {
        const keywordEnd = keywordStart + keyword.length;
        const distance = Math.min(
          Math.abs(evidenceStart - keywordEnd),
          Math.abs(keywordStart - evidenceEnd),
        );

        if (distance <= 28 && (!nearest || distance < nearest.distance)) {
          nearest = { aspect, distance };
        }

        keywordStart = text.indexOf(keyword, keywordStart + keyword.length);
      }
    }
  }

  return nearest?.aspect ?? "overall";
}

function collectEvidence(normalizedText: string): {
  evidence: EvidenceSpan[];
  weights: Map<EvidenceSpan, number>;
} {
  const occupied: { start: number; end: number }[] = [];
  const evidence: EvidenceSpan[] = [];
  const weights = new Map<EvidenceSpan, number>();

  for (const rule of CUE_RULES) {
    let start = normalizedText.indexOf(rule.cue);
    while (start >= 0) {
      const end = start + rule.cue.length;
      if (!rangesOverlap(start, end, occupied)) {
        const span: EvidenceSpan = {
          aspect:
            rule.aspect ?? inferNearbyAspect(normalizedText, start, end),
          polarity: rule.polarity,
          start,
          end,
          excerpt: normalizedText.slice(start, end),
          cue: rule.cue,
        };
        occupied.push({ start, end });
        evidence.push(span);
        weights.set(span, rule.weight);
      }

      start = normalizedText.indexOf(rule.cue, start + rule.cue.length);
    }
  }

  for (const [aspect, keywords] of Object.entries(ASPECT_KEYWORDS) as [
    AspectId,
    readonly string[],
  ][]) {
    for (const keyword of keywords) {
      let start = normalizedText.indexOf(keyword);
      while (start >= 0) {
        const end = start + keyword.length;
        if (!rangesOverlap(start, end, occupied)) {
          const span: EvidenceSpan = {
            aspect,
            polarity: "neutral",
            start,
            end,
            excerpt: normalizedText.slice(start, end),
            cue: keyword,
          };
          occupied.push({ start, end });
          evidence.push(span);
          weights.set(span, 0);
        }

        start = normalizedText.indexOf(keyword, start + keyword.length);
      }
    }
  }

  evidence.sort((left, right) => left.start - right.start);
  return { evidence, weights };
}

function scoreAspects(
  evidence: readonly EvidenceSpan[],
  weights: ReadonlyMap<EvidenceSpan, number>,
): Partial<Record<AspectId, AspectScore>> {
  const totals = new Map<AspectId, MutableAspectScore>();

  for (const span of evidence) {
    if (span.aspect === "overall") {
      continue;
    }

    const score = totals.get(span.aspect) ?? { positive: 0, negative: 0 };
    if (span.polarity !== "neutral") {
      score[span.polarity] += weights.get(span) ?? 1;
    }
    totals.set(span.aspect, score);
  }

  const scores: Partial<Record<AspectId, AspectScore>> = {};
  for (const [aspect, score] of totals.entries()) {
    const total = score.positive + score.negative;
    const mentions = evidence.filter((span) => span.aspect === aspect).length;
    scores[aspect] = {
      mentions,
      positive: round(score.positive),
      negative: round(score.negative),
      net: total === 0 ? 0 : round((score.positive - score.negative) / total),
      confidence: round(clamp(0.3 + mentions * 0.1 + total * 0.1, 0, 0.9)),
    };
  }

  return scores;
}

function detectSuspiciousPatterns(text: string): {
  score: number;
  reasons: SuspiciousReason[];
} {
  const checks: readonly {
    reason: SuspiciousReason;
    pattern: RegExp;
    weight: number;
  }[] = [
    {
      reason: "contact_or_link",
      pattern: /(?:https?:\/\/|www\.|@[\p{L}\p{N}_]+|(?:\+?98|0)?9\d{9})/iu,
      weight: 0.4,
    },
    {
      reason: "excessive_punctuation",
      pattern: /[!؟?]{5,}/u,
      weight: 0.15,
    },
    {
      reason: "repeated_character",
      pattern: /(.)\1{4,}/u,
      weight: 0.35,
    },
    {
      reason: "repeated_word",
      pattern: /([\p{L}]{2,})(?:\s+\1){3,}/iu,
      weight: 0.35,
    },
  ];

  const matched = checks.filter((check) => check.pattern.test(text));
  return {
    score: round(clamp(matched.reduce((sum, check) => sum + check.weight, 0), 0, 1)),
    reasons: matched.map((check) => check.reason),
  };
}

function classifySentiment(
  evidence: readonly EvidenceSpan[],
  weights: ReadonlyMap<EvidenceSpan, number>,
): Sentiment {
  let positive = 0;
  let negative = 0;

  for (const span of evidence) {
    if (span.polarity === "positive") {
      positive += weights.get(span) ?? 1;
    } else if (span.polarity === "negative") {
      negative += weights.get(span) ?? 1;
    }
  }

  if (positive > 0 && negative > 0) {
    return "mixed";
  }
  if (positive > 0) {
    return "positive";
  }
  if (negative > 0) {
    return "negative";
  }
  return "neutral";
}

function selectIssueCluster(
  sentiment: Sentiment,
  aspectScores: Partial<Record<AspectId, AspectScore>>,
  evidence: readonly EvidenceSpan[],
): IssueCluster | null {
  const rankedNegativeAspects = (
    Object.entries(aspectScores) as [AspectId, AspectScore][]
  )
    .filter(([, score]) => score.negative > 0)
    .sort((left, right) => right[1].negative - left[1].negative);

  const leadingAspect = rankedNegativeAspects[0]?.[0];
  if (leadingAspect) {
    return ISSUE_CLUSTERS[leadingAspect];
  }

  const hasOverallNegative = evidence.some(
    (span) => span.aspect === "overall" && span.polarity === "negative",
  );
  if (hasOverallNegative || sentiment === "negative") {
    return "general_dissatisfaction";
  }

  return null;
}

export function analyzePersianCustomerVoice(
  sourceText: string,
): CustomerVoiceAnalysis {
  const normalizedText = normalizePersianText(sourceText);
  const { evidence, weights } = collectEvidence(normalizedText);
  const sentiment = classifySentiment(evidence, weights);
  const aspectScores = scoreAspects(evidence, weights);
  const suspicious = detectSuspiciousPatterns(normalizedText);
  const confidence =
    evidence.length === 0
      ? 0.2
      : round(clamp(0.4 + evidence.length * 0.11, 0, 0.9));

  return {
    model: CUSTOMER_VOICE_MODEL,
    normalizedText,
    offsetBasis: "normalized_text_utf16",
    sentiment,
    aspectScores,
    evidenceSpans: evidence,
    issueCluster: selectIssueCluster(sentiment, aspectScores, evidence),
    suspiciousScore: suspicious.score,
    confidence,
    moderation: {
      status: suspicious.score > 0 ? "needs_human_review" : "clear",
      reasons: suspicious.reasons,
    },
  };
}

export type HumanCorrection = {
  correctionId: string;
  reviewerId: string;
  correctedAt: string;
  modelOutput: {
    sentiment: Sentiment;
    aspectIds: AspectId[];
    issueCluster: IssueCluster | null;
    model: typeof CUSTOMER_VOICE_MODEL;
  };
  humanLabel: {
    sentiment: Sentiment;
    aspectIds: AspectId[];
    issueCluster: string | null;
  };
  note: string;
};

type HumanCorrectionInput = {
  reviewerId: string;
  correctedAt: string;
  sentiment: Sentiment;
  aspectIds: AspectId[];
  issueCluster: string | null;
  note: string;
};

/**
 * Returns a new history array and preserves the exact model output that the
 * reviewer corrected. Persistence can later store this record append-only.
 */
export function appendHumanCorrection(
  history: readonly HumanCorrection[],
  analysis: CustomerVoiceAnalysis,
  input: HumanCorrectionInput,
): HumanCorrection[] {
  return [
    ...history,
    {
      correctionId: `${input.reviewerId}:${input.correctedAt}`,
      reviewerId: input.reviewerId,
      correctedAt: input.correctedAt,
      modelOutput: {
        sentiment: analysis.sentiment,
        aspectIds: Object.keys(analysis.aspectScores) as AspectId[],
        issueCluster: analysis.issueCluster,
        model: analysis.model,
      },
      humanLabel: {
        sentiment: input.sentiment,
        aspectIds: [...input.aspectIds],
        issueCluster: input.issueCluster,
      },
      note: input.note,
    },
  ];
}
