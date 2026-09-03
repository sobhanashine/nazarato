import { describe, expect, it } from "vitest";
import { evaluateBaseline, type LabelledReview } from "./evaluate-baseline";

describe("evaluateBaseline", () => {
  it("reports transparent label and evidence metrics", () => {
    const dataset: LabelledReview[] = [
      {
        id: "one",
        text: "طعم عالی بود.",
        expectedSentiment: "positive",
        expectedAspects: ["taste"],
        expectedIssueCluster: null,
      },
      {
        id: "two",
        text: "سفارش خیلی دیر رسید.",
        expectedSentiment: "negative",
        expectedAspects: ["wait_time"],
        expectedIssueCluster: "wait_time",
      },
    ];

    const report = evaluateBaseline(dataset);

    expect(report.datasetSize).toBe(2);
    expect(report.sentiment.accuracy).toBe(1);
    expect(report.aspects.microF1).toBe(1);
    expect(report.issueCluster.accuracy).toBe(1);
    expect(report.evidence.validSpanRate).toBe(1);
    expect(report.provenance.kind).toBe("synthetic-development");
  });

  it("rejects duplicate IDs so the metric denominator stays auditable", () => {
    const duplicate: LabelledReview[] = [
      {
        id: "same",
        text: "خوب بود",
        expectedSentiment: "positive",
        expectedAspects: [],
        expectedIssueCluster: null,
      },
      {
        id: "same",
        text: "بد بود",
        expectedSentiment: "negative",
        expectedAspects: [],
        expectedIssueCluster: "general_dissatisfaction",
      },
    ];

    expect(() => evaluateBaseline(duplicate)).toThrow(/duplicate/i);
  });
});
