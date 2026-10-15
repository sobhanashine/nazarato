import { describe, expect, it } from "vitest";
import { buildRealResult, buildRealSignals, parseRealTasteProfile } from "./real-recommendation";
import { CUSTOMER_VOICE_MODEL } from "@/lib/intelligence/customer-voice-baseline";
import type { NabzBusinessPoolCandidate } from "./business-pool";

const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const now = new Date("2026-10-06T10:00:00Z");
const businesses: NabzBusinessPoolCandidate[] = [1, 2, 3, 4].map(n => ({ id: id(n), slug: `isolated-${n}`, name: `مکان آزمایشی ${n}`, kind: "کافه", neighborhoodSlug: "golsar", priceBand: null, sourceFacts: ["name", "city", "category", "address"], comparisonEvidenceCount: 0, reviewEvidenceCount: 3, firstPartyEvidenceCount: 3, duelReady: true, recommendationReady: true }));
const choices = [[1,2],[1,3],[1,4],[2,3],[2,4]].map(([w,l]) => ({ winnerId: id(w), loserId: id(l) }));
const review = (n: number, overrides = {}) => ({ id: id(100+n), author_id: id(200+n), business_id: id(1), status: "published", origin_kind:"first_party", body: "فضای آرام و خوب", created_at: "2026-10-01T10:00:00Z", review_analyses: [{ model_id: CUSTOMER_VOICE_MODEL.id, model_version: CUSTOMER_VOICE_MODEL.version, is_active: true, human_status: "unreviewed", confidence: 0.8, suspicious_score: 0, aspect_scores: { atmosphere: { net: 1, confidence: 0.8 } }, evidence_spans: [{ aspect: "atmosphere", polarity: "positive", excerpt: "فضای آرام و خوب" }] }], ...overrides });

describe("real Nabz payoff", () => {
  it("completes five real choices with a cited, versioned recommendation", () => {
    const result = buildRealResult({ businesses, choices, reviews: [review(1),review(2),review(3)], scenario: "date", now });
    expect(result?.status).toBe("ready"); expect(result?.profile.evidenceCount).toBe(5);
    expect(result?.recommendations[0]).toMatchObject({ businessId: id(1), signals: [{ aspect: "atmosphere", authorCount: 3, citations: [{reviewId: id(101)}, {reviewId: id(102)}, {reviewId: id(103)}] }] });
    expect(parseRealTasteProfile(result?.profile)).toEqual(result?.profile);
  });
  it("withholds recommendations from sparse evidence and makes no qualities from a name", () => {
    const result = buildRealResult({ businesses, choices, reviews: [review(1),review(2)], scenario: "date", now });
    expect(result?.status).toBe("insufficient_evidence"); expect(result?.recommendations).toEqual([]);
  });
  it("does not count repeated authors as independent evidence", () => {
    expect(buildRealSignals([review(1), review(2,{author_id:id(201)}), review(3,{author_id:id(201)})],now).size).toBe(0);
  });
  it("excludes old, pending, rejected and private owner-corrected observations", () => {
    const analysis = review(1).review_analyses[0];
    for (const patch of [{ origin_kind: "development_fixture" }, { origin_kind: "unknown" }, { status: "pending" }, { created_at: "2025-01-01" }, {review_analyses:[{...analysis,human_status:"corrected"}]}, {review_analyses:[{...analysis,human_status:"rejected"}]}, {review_analyses:[{...analysis,model_version:"obsolete"}]}, {review_analyses:[{...analysis,confidence:0.2}]}, {review_analyses:[{...analysis,evidence_spans:[{aspect:"atmosphere",polarity:"positive",excerpt:"invented quote"}]}]}]) {
      expect(buildRealSignals([review(1,patch),review(2,patch),review(3,patch)],now).size).toBe(0);
    }
  });
  it("rejects forged/stale targets and duplicate unordered pairs", () => {
    expect(buildRealResult({ businesses: businesses.slice(0,3), choices, reviews:[], scenario:"date", now })).toBeNull();
    expect(buildRealResult({ businesses, choices:[...choices.slice(0,4),{winnerId:id(2),loserId:id(1)}], reviews:[], scenario:"date", now })).toBeNull();
    expect(parseRealTasteProfile({modelId:"nabz-demo"})).toBeNull();
  });
});
