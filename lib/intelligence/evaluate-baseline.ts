import {
  analyzePersianCustomerVoice,
  type AspectId,
  type IssueCluster,
  type Sentiment,
} from "./customer-voice-baseline.ts";

export type LabelledReview = {
  id: string;
  text: string;
  expectedSentiment: Sentiment;
  expectedAspects: AspectId[];
  expectedIssueCluster: IssueCluster | null;
};

export type LabelledDataset = {
  metadata: {
    kind: "synthetic-development";
    language: "fa";
    createdAt: string;
    description: string;
  };
  reviews: LabelledReview[];
};

export type BaselineEvaluation = {
  provenance: LabelledDataset["metadata"];
  datasetSize: number;
  sentiment: { correct: number; accuracy: number };
  aspects: {
    truePositive: number;
    falsePositive: number;
    falseNegative: number;
    microPrecision: number;
    microRecall: number;
    microF1: number;
  };
  issueCluster: { correct: number; accuracy: number };
  evidence: { validSpans: number; totalSpans: number; validSpanRate: number };
  cases: {
    id: string;
    sentimentCorrect: boolean;
    predictedSentiment: Sentiment;
    predictedAspects: AspectId[];
    issueClusterCorrect: boolean;
  }[];
};

const DEFAULT_PROVENANCE: LabelledDataset["metadata"] = {
  kind: "synthetic-development",
  language: "fa",
  createdAt: "2026-09-03",
  description: "Inline synthetic test data; not pilot or production evidence.",
};

const SENTIMENTS: readonly Sentiment[] = [
  "positive",
  "neutral",
  "mixed",
  "negative",
];
const ASPECTS: readonly AspectId[] = [
  "taste",
  "service",
  "value",
  "atmosphere",
  "cleanliness",
  "wait_time",
];
const ISSUE_CLUSTERS: readonly IssueCluster[] = [
  "taste_quality",
  "service_experience",
  "price_value",
  "atmosphere_comfort",
  "cleanliness_hygiene",
  "wait_time",
  "general_dissatisfaction",
];

function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function safeRatio(numerator: number, denominator: number): number {
  return denominator === 0 ? 1 : round(numerator / denominator);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseLabelledDataset(input: unknown): LabelledDataset {
  if (!isRecord(input) || !isRecord(input.metadata) || !Array.isArray(input.reviews)) {
    throw new Error("Invalid labelled dataset envelope");
  }

  const metadata = input.metadata;
  if (
    metadata.kind !== "synthetic-development" ||
    metadata.language !== "fa" ||
    typeof metadata.createdAt !== "string" ||
    typeof metadata.description !== "string"
  ) {
    throw new Error("Invalid labelled dataset provenance");
  }

  const reviews = input.reviews.map((item, index): LabelledReview => {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      item.id.trim().length === 0 ||
      typeof item.text !== "string" ||
      item.text.trim().length === 0 ||
      item.text.length > 5_000 ||
      !SENTIMENTS.includes(item.expectedSentiment as Sentiment) ||
      !isStringArray(item.expectedAspects) ||
      !item.expectedAspects.every((aspect) => ASPECTS.includes(aspect as AspectId)) ||
      new Set(item.expectedAspects).size !== item.expectedAspects.length ||
      !(
        item.expectedIssueCluster === null ||
        ISSUE_CLUSTERS.includes(item.expectedIssueCluster as IssueCluster)
      )
    ) {
      throw new Error(`Invalid labelled review at index ${index}`);
    }

    return {
      id: item.id,
      text: item.text,
      expectedSentiment: item.expectedSentiment as Sentiment,
      expectedAspects: item.expectedAspects as AspectId[],
      expectedIssueCluster: item.expectedIssueCluster as IssueCluster | null,
    };
  });

  return {
    metadata: metadata as LabelledDataset["metadata"],
    reviews,
  };
}

export function evaluateBaseline(
  reviews: readonly LabelledReview[],
  provenance: LabelledDataset["metadata"] = DEFAULT_PROVENANCE,
): BaselineEvaluation {
  if (reviews.length === 0) {
    throw new Error("The labelled dataset must not be empty");
  }

  const ids = new Set<string>();
  for (const review of reviews) {
    if (ids.has(review.id)) {
      throw new Error(`Duplicate labelled review id: ${review.id}`);
    }
    ids.add(review.id);
  }

  let sentimentCorrect = 0;
  let aspectTruePositive = 0;
  let aspectFalsePositive = 0;
  let aspectFalseNegative = 0;
  let clusterCorrect = 0;
  let validSpans = 0;
  let totalSpans = 0;

  const cases = reviews.map((review) => {
    const result = analyzePersianCustomerVoice(review.text);
    const predictedAspects = Object.keys(result.aspectScores) as AspectId[];
    const expectedAspects = new Set(review.expectedAspects);
    const predictedAspectSet = new Set(predictedAspects);

    for (const aspect of predictedAspectSet) {
      if (expectedAspects.has(aspect)) {
        aspectTruePositive += 1;
      } else {
        aspectFalsePositive += 1;
      }
    }
    for (const aspect of expectedAspects) {
      if (!predictedAspectSet.has(aspect)) {
        aspectFalseNegative += 1;
      }
    }

    const isSentimentCorrect = result.sentiment === review.expectedSentiment;
    const isClusterCorrect = result.issueCluster === review.expectedIssueCluster;
    sentimentCorrect += isSentimentCorrect ? 1 : 0;
    clusterCorrect += isClusterCorrect ? 1 : 0;

    for (const span of result.evidenceSpans) {
      totalSpans += 1;
      if (
        span.start >= 0 &&
        span.end > span.start &&
        result.normalizedText.slice(span.start, span.end) === span.excerpt
      ) {
        validSpans += 1;
      }
    }

    return {
      id: review.id,
      sentimentCorrect: isSentimentCorrect,
      predictedSentiment: result.sentiment,
      predictedAspects,
      issueClusterCorrect: isClusterCorrect,
    };
  });

  const microPrecision = safeRatio(
    aspectTruePositive,
    aspectTruePositive + aspectFalsePositive,
  );
  const microRecall = safeRatio(
    aspectTruePositive,
    aspectTruePositive + aspectFalseNegative,
  );
  const microF1 =
    microPrecision + microRecall === 0
      ? 0
      : round((2 * microPrecision * microRecall) / (microPrecision + microRecall));

  return {
    provenance,
    datasetSize: reviews.length,
    sentiment: {
      correct: sentimentCorrect,
      accuracy: safeRatio(sentimentCorrect, reviews.length),
    },
    aspects: {
      truePositive: aspectTruePositive,
      falsePositive: aspectFalsePositive,
      falseNegative: aspectFalseNegative,
      microPrecision,
      microRecall,
      microF1,
    },
    issueCluster: {
      correct: clusterCorrect,
      accuracy: safeRatio(clusterCorrect, reviews.length),
    },
    evidence: {
      validSpans,
      totalSpans,
      validSpanRate: safeRatio(validSpans, totalSpans),
    },
    cases,
  };
}
