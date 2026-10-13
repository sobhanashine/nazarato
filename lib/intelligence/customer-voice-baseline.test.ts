import { describe, expect, it } from "vitest";
import {
  analyzePersianCustomerVoice,
  appendHumanCorrection,
  CUSTOMER_VOICE_MODEL,
  type HumanCorrection,
} from "./customer-voice-baseline";

describe("analyzePersianCustomerVoice", () => {
  it("returns versioned aspect sentiment with exact normalized-text evidence", () => {
    const result = analyzePersianCustomerVoice(
      "طعم غذا عالی بود ولی خیلی دیر آوردند و قیمت هم گرون بود.",
    );

    expect(result.model).toEqual(CUSTOMER_VOICE_MODEL);
    expect(result.sentiment).toBe("mixed");
    expect(result.aspectScores.taste?.positive).toBeGreaterThan(0);
    expect(result.aspectScores.wait_time?.negative).toBeGreaterThan(0);
    expect(result.aspectScores.value?.negative).toBeGreaterThan(0);
    expect(result.issueCluster).toBe("wait_time");
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);

    for (const evidence of result.evidenceSpans) {
      expect(
        result.normalizedText.slice(evidence.start, evidence.end),
      ).toBe(evidence.excerpt);
    }
  });

  it("handles common Persian negation phrases before shorter cues", () => {
    expect(analyzePersianCustomerVoice("بد نبود، راضی بودم.").sentiment).toBe(
      "positive",
    );
    expect(analyzePersianCustomerVoice("برخورد خوب نبود.").sentiment).toBe(
      "negative",
    );
  });

  it("clusters similar negative feedback into a stable business theme", () => {
    const slowService = analyzePersianCustomerVoice(
      "برای سفارش خیلی معطل شدیم.",
    );
    const lateOrder = analyzePersianCustomerVoice("سفارش خیلی دیر رسید.");

    expect(slowService.issueCluster).toBe("wait_time");
    expect(lateOrder.issueCluster).toBe("wait_time");
  });

  it("flags suspicious patterns for review without producing a delete action", () => {
    const result = analyzePersianCustomerVoice(
      "عاااااالی!!!!! برای تخفیف با 09123456789 تماس بگیرید",
    );

    expect(result.suspiciousScore).toBeGreaterThan(0);
    expect(result.moderation.status).toBe("needs_human_review");
    expect(result.moderation).not.toHaveProperty("delete");
  });

  it("does not invent evidence or confidence for an unknown statement", () => {
    const result = analyzePersianCustomerVoice("امروز آنجا بودم.");

    expect(result.sentiment).toBe("neutral");
    expect(result.evidenceSpans).toEqual([]);
    expect(result.confidence).toBeLessThan(0.5);
  });
});

describe("appendHumanCorrection", () => {
  it("retains the model output and an append-only correction trail", () => {
    const analysis = analyzePersianCustomerVoice("غذا سرد بود.");
    const history: HumanCorrection[] = [];
    const corrected = appendHumanCorrection(history, analysis, {
      reviewerId: "pilot-reviewer-01",
      correctedAt: "2026-09-03T08:00:00.000Z",
      sentiment: "negative",
      aspectIds: ["taste"],
      issueCluster: "food_temperature",
      note: "The phrase describes serving temperature.",
    });

    expect(history).toEqual([]);
    expect(corrected).toHaveLength(1);
    expect(corrected[0]?.modelOutput).toEqual({
      sentiment: analysis.sentiment,
      aspectIds: Object.keys(analysis.aspectScores),
      issueCluster: analysis.issueCluster,
      model: CUSTOMER_VOICE_MODEL,
    });
    expect(corrected[0]?.humanLabel.issueCluster).toBe("food_temperature");
  });
});
