import { describe, expect, it } from "vitest";
import {
  parseCorrectionInput,
  parseImprovementActionInput,
  toTehranIsoDay,
} from "./owner-action-input";

describe("parseCorrectionInput", () => {
  it("accepts a bounded correction from an owner", () => {
    const input = new FormData();
    input.set("businessId", "11111111-1111-4111-8111-111111111111");
    input.set("reviewId", "22222222-2222-4222-8222-222222222222");
    input.set("sentiment", "negative");
    input.set("aspect", "wait_time");
    input.set("issueCluster", "wait_time");
    input.set("note", "منظور مشتری زمان انتظار بوده است.");

    expect(parseCorrectionInput(input)).toEqual({
      ok: true,
      value: expect.objectContaining({ aspect: "wait_time", sentiment: "negative" }),
    });
  });

  it("rejects unknown labels and malformed identifiers", () => {
    const input = new FormData();
    input.set("businessId", "not-an-id");
    input.set("reviewId", "also-not-an-id");
    input.set("sentiment", "amazing");
    input.set("aspect", "secret_weight");
    input.set("issueCluster", "anything");

    expect(parseCorrectionInput(input)).toEqual(
      expect.objectContaining({ ok: false }),
    );
  });

  it("requires an issue cluster for negative feedback and clears it for praise", () => {
    const negative = new FormData();
    negative.set("businessId", "11111111-1111-4111-8111-111111111111");
    negative.set("reviewId", "22222222-2222-4222-8222-222222222222");
    negative.set("sentiment", "negative");
    negative.set("aspect", "service");
    negative.set("issueCluster", "");
    expect(parseCorrectionInput(negative)).toEqual(
      expect.objectContaining({ ok: false }),
    );

    const positive = new FormData();
    positive.set("businessId", "11111111-1111-4111-8111-111111111111");
    positive.set("reviewId", "22222222-2222-4222-8222-222222222222");
    positive.set("sentiment", "positive");
    positive.set("aspect", "taste");
    positive.set("issueCluster", "service_experience");
    expect(parseCorrectionInput(positive)).toEqual({
      ok: true,
      value: expect.objectContaining({ issueCluster: null }),
    });
  });
});

describe("parseImprovementActionInput", () => {
  it("accepts a measurable action with a future follow-up", () => {
    const input = new FormData();
    input.set("businessId", "11111111-1111-4111-8111-111111111111");
    input.set("title", "کاهش زمان تحویل سفارش");
    input.set("targetAspect", "wait_time");
    input.set("targetIssueCluster", "wait_time");
    input.set("targetReductionPct", "25");
    input.set("followUpDate", "2026-10-01");

    expect(
      parseImprovementActionInput(input, new Date("2026-09-03T00:00:00.000Z")),
    ).toEqual({
      ok: true,
      value: expect.objectContaining({
        targetReductionPct: 25,
        followUpDate: "2026-10-01",
      }),
    });
  });

  it("rejects vague, past-dated, or unbounded actions", () => {
    const input = new FormData();
    input.set("businessId", "11111111-1111-4111-8111-111111111111");
    input.set("title", "حل");
    input.set("targetAspect", "wait_time");
    input.set("targetIssueCluster", "wait_time");
    input.set("targetReductionPct", "150");
    input.set("followUpDate", "2026-08-01");

    expect(
      parseImprovementActionInput(input, new Date("2026-09-03T00:00:00.000Z")),
    ).toEqual(expect.objectContaining({ ok: false }));
  });

  it("uses the Tehran calendar day at the UTC date boundary", () => {
    const justAfterMidnightInTehran = new Date("2026-09-03T21:00:00.000Z");
    expect(toTehranIsoDay(justAfterMidnightInTehran)).toBe("2026-09-04");

    const input = new FormData();
    input.set("businessId", "11111111-1111-4111-8111-111111111111");
    input.set("title", "کاهش زمان تحویل سفارش");
    input.set("targetAspect", "wait_time");
    input.set("targetIssueCluster", "wait_time");
    input.set("targetReductionPct", "25");
    input.set("followUpDate", "2026-09-04");

    expect(parseImprovementActionInput(input, justAfterMidnightInTehran)).toEqual(
      expect.objectContaining({ ok: false }),
    );
  });
});
