import { CUSTOMER_VOICE_MODEL, type AspectId } from "@/lib/intelligence/customer-voice-baseline";
import { normalizePersianText } from "@/lib/intelligence/persian-normalizer";
import type { NabzBusinessPoolCandidate } from "./business-pool";
import { COMPARISON_SCENARIOS, type ComparisonScenario } from "./vote-contract";

export const REAL_TASTE_MODEL = { id: "nabz-real-evidence", version: "1.0.0" } as const;
export const REAL_EVIDENCE_POLICY = { minimumAuthors: 3, minimumConfidence: 0.55, maximumAgeDays: 180 } as const;
export const REAL_ASPECTS: readonly AspectId[] = ["taste", "service", "value", "atmosphere", "cleanliness", "wait_time"];
export const REAL_ASPECT_LABELS: Record<AspectId, string> = { taste: "طعم", service: "سرویس", value: "ارزش نسبت به قیمت", atmosphere: "فضا", cleanliness: "نظافت", wait_time: "زمان انتظار" };
const SCENARIO_ASPECTS: Record<ComparisonScenario, readonly AspectId[]> = { date: ["atmosphere", "service"], laptop: ["atmosphere", "wait_time"], budget: ["value"], "local-food": ["taste"] };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type RealChoice = { winnerId: string; loserId: string };
export type RealCitation = { reviewId: string; excerpt: string; createdAt: string };
export type RealSignal = { aspect: AspectId; score: number; confidence: number; authorCount: number; citations: RealCitation[] };
export type RealTasteProfile = { modelId: string; modelVersion: string; scenario: ComparisonScenario; weights: Record<AspectId, number>; evidenceCount: number; signalCount: number; updatedAt: string };
export type RealRecommendation = { businessId: string; slug: string; name: string; score: number; signals: RealSignal[] };
export type RealResult = { status: "ready" | "insufficient_evidence"; profile: RealTasteProfile; recommendations: RealRecommendation[]; message: string };

function record(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function finite(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }

/** Public opinions only. Owner corrections and private preference data never enter this projection. */
export function buildRealSignals(rows: unknown, now = new Date()): Map<string, RealSignal[]> {
  const groups = new Map<string, Map<string, { score: number; confidence: number; citation: RealCitation }>>();
  if (!Array.isArray(rows)) return new Map();
  for (const row of rows) {
    if (!record(row) || (row.status !== "published" || row.origin_kind !== "first_party") || typeof row.id !== "string" || !UUID.test(row.id) || typeof row.author_id !== "string" || !UUID.test(row.author_id) || typeof row.business_id !== "string" || !UUID.test(row.business_id) || typeof row.body !== "string" || typeof row.created_at !== "string" || !Array.isArray(row.review_analyses)) continue;
    const age = now.getTime() - new Date(row.created_at).getTime();
    if (!Number.isFinite(age) || age < 0 || age > REAL_EVIDENCE_POLICY.maximumAgeDays * 86_400_000) continue;
    const normalized = normalizePersianText(row.body);
    for (const analysis of row.review_analyses) {
      if (!record(analysis) || analysis.is_active !== true || !["unreviewed", "confirmed"].includes(String(analysis.human_status)) || analysis.model_id !== CUSTOMER_VOICE_MODEL.id || analysis.model_version !== CUSTOMER_VOICE_MODEL.version || !finite(analysis.confidence) || analysis.confidence < REAL_EVIDENCE_POLICY.minimumConfidence || analysis.confidence > 1 || !finite(analysis.suspicious_score) || analysis.suspicious_score >= 0.5 || analysis.suspicious_score < 0 || !record(analysis.aspect_scores) || !Array.isArray(analysis.evidence_spans)) continue;
      for (const aspect of REAL_ASPECTS) {
        const score = analysis.aspect_scores[aspect];
        if (!record(score) || !finite(score.net) || score.net < -1 || score.net > 1 || !finite(score.confidence) || score.confidence < REAL_EVIDENCE_POLICY.minimumConfidence || score.confidence > 1) continue;
        const polarity = score.net > 0 ? "positive" : score.net < 0 ? "negative" : "neutral";
        const span = analysis.evidence_spans.find(value => record(value) && value.aspect === aspect && value.polarity === polarity && typeof value.excerpt === "string" && value.excerpt.length > 0 && normalized.includes(value.excerpt));
        if (!record(span) || typeof span.excerpt !== "string") continue;
        const key = `${row.business_id}:${aspect}`;
        const group = groups.get(key) ?? new Map();
        // One author can support an aspect once, even with several reviews.
        if (!group.has(row.author_id)) group.set(row.author_id, { score: score.net, confidence: Math.min(score.confidence, analysis.confidence), citation: { reviewId: row.id, excerpt: span.excerpt.slice(0, 180), createdAt: row.created_at } });
        groups.set(key, group);
      }
    }
  }
  const result = new Map<string, RealSignal[]>();
  for (const [key, authors] of groups) {
    if (authors.size < REAL_EVIDENCE_POLICY.minimumAuthors) continue;
    const split = key.lastIndexOf(":"); const id = key.slice(0, split); const aspect = key.slice(split + 1) as AspectId;
    const values = [...authors.values()];
    const signals = result.get(id) ?? [];
    signals.push({ aspect, score: values.reduce((n, row) => n + row.score, 0) / values.length, confidence: values.reduce((n, row) => n + row.confidence, 0) / values.length, authorCount: values.length, citations: values.map(row => row.citation).slice(0, 3) });
    result.set(id, signals);
  }
  return result;
}

/** Choices come from the caller's accepted server-side votes, never client scores. */
export function buildRealResult(input: { businesses: readonly NabzBusinessPoolCandidate[]; choices: readonly RealChoice[]; reviews: unknown; scenario: ComparisonScenario; now?: Date }): RealResult | null {
  const now = input.now ?? new Date();
  const eligible = new Map(input.businesses.filter(b => b.duelReady).map(b => [b.id, b]));
  const pairs = new Set<string>();
  if (input.choices.length !== 5) return null;
  for (const choice of input.choices) {
    if (!eligible.has(choice.winnerId) || !eligible.has(choice.loserId) || choice.winnerId === choice.loserId) return null;
    pairs.add([choice.winnerId, choice.loserId].sort().join(":"));
  }
  if (pairs.size !== 5) return null;
  const signals = buildRealSignals(input.reviews, now);
  const weights = Object.fromEntries(REAL_ASPECTS.map(aspect => [aspect, SCENARIO_ASPECTS[input.scenario].includes(aspect) ? 2 : 1])) as Record<AspectId, number>;
  let signalCount = 0;
  for (const choice of input.choices) {
    for (const aspect of REAL_ASPECTS) {
      const winner = signals.get(choice.winnerId)?.find(s => s.aspect === aspect);
      const loser = signals.get(choice.loserId)?.find(s => s.aspect === aspect);
      if (!winner || !loser) continue;
      weights[aspect] += (winner.score - loser.score) * 0.1;
      signalCount += 1;
    }
  }
  const total = Object.values(weights).reduce((n, value) => n + value, 0);
  for (const aspect of REAL_ASPECTS) weights[aspect] /= total;
  const profile: RealTasteProfile = { modelId: REAL_TASTE_MODEL.id, modelVersion: REAL_TASTE_MODEL.version, scenario: input.scenario, weights, evidenceCount: pairs.size, signalCount, updatedAt: now.toISOString() };
  const recommendations: RealRecommendation[] = [];
  for (const business of eligible.values()) {
    const relevant = (signals.get(business.id) ?? []).filter(s => SCENARIO_ASPECTS[input.scenario].includes(s.aspect));
    const positive = relevant.filter(s => s.score > 0);
    if (!positive.length) continue;
    const score = relevant.reduce((n, s) => n + s.score * weights[s.aspect] * s.confidence, 0);
    if (score <= 0) continue;
    recommendations.push({ businessId: business.id, slug: business.slug, name: business.name, score, signals: relevant });
  }
  recommendations.sort((a, b) => b.score - a.score || a.businessId.localeCompare(b.businessId));
  return { status: recommendations.length ? "ready" : "insufficient_evidence", profile, recommendations: recommendations.slice(0, 3), message: recommendations.length ? "این پیشنهاد اولیه از تجربه‌های منتشرشده و انتخاب‌های همین جلسه ساخته شد؛ تضمین کیفیت نیست." : "داده کافی نداریم؛ پنج انتخابت ثبت شده، اما برای پیشنهاد قابل‌توضیح شاهد کافی نداریم." };
}

export function parseRealTasteProfile(value: unknown): RealTasteProfile | null {
  if (!record(value) || value.modelId !== REAL_TASTE_MODEL.id || value.modelVersion !== REAL_TASTE_MODEL.version || !COMPARISON_SCENARIOS.includes(value.scenario as ComparisonScenario) || value.evidenceCount !== 5 || !Number.isSafeInteger(value.signalCount) || Number(value.signalCount) < 0 || Number(value.signalCount) > 30 || typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt)) || !record(value.weights)) return null;
  const weights = value.weights;
  if (Object.keys(weights).length !== REAL_ASPECTS.length || !REAL_ASPECTS.every(a => finite(weights[a]) && weights[a] >= 0 && weights[a] <= 1)) return null;
  if (Math.abs(Object.values(weights).reduce<number>((n, v) => n + Number(v), 0) - 1) > 0.0001) return null;
  return { modelId: REAL_TASTE_MODEL.id, modelVersion: REAL_TASTE_MODEL.version, scenario: value.scenario as ComparisonScenario, evidenceCount: 5, signalCount: Number(value.signalCount), updatedAt: value.updatedAt, weights: weights as Record<AspectId, number> };
}
