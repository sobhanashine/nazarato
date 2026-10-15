import { describe, expect, it } from "vitest";
import { measureOwnerFollowUp, OWNER_METRIC_VERSION } from "./owner-follow-up";
import { calculateNegativeBaseline, type OwnerAnalyzedReview } from "./owner-action-insights";
import { CUSTOMER_VOICE_MODEL } from "@/lib/intelligence/customer-voice-baseline";
const action = { baselineWindowEnd:"2026-09-01",followUpDate:"2026-09-30",targetAspect:"service" as const,modelId:CUSTOMER_VOICE_MODEL.id,modelVersion:CUSTOMER_VOICE_MODEL.version,metricVersion:OWNER_METRIC_VERSION,baselineNegativeRate:0.6,targetNegativeRate:0.4 };
const now = new Date("2026-10-06T12:00:00Z");
function review(n:number, negative = false): OwnerAnalyzedReview { return {id:`review-${n}`,body:"تجربه آزمایشی جدا",createdAt:"2026-09-15T12:00:00Z",rating:3,latestCorrection:null,analysis:{modelId:CUSTOMER_VOICE_MODEL.id,modelVersion:CUSTOMER_VOICE_MODEL.version,humanStatus:"unreviewed",sentiment:negative?"negative":"positive",confidence:0.8,issueCluster:null,evidenceSpans:[],aspectScores:{service:{positive:negative?0:1,negative:negative?1:0,net:negative?-1:1,mentions:1,confidence:0.8}}}}; }
describe("owner observation",()=>{
  it("records a non-overlapping follow-up using the baseline's version",()=>{ expect(measureOwnerFollowUp(action,[review(1,true),review(2),review(3)],now)).toMatchObject({ok:true,windowStart:"2026-09-02",windowEnd:"2026-09-30",reviewCount:3,negativeMentions:1,negativeRate:0.3333,targetMet:true}); });
  it("keeps sparse and premature measurements active",()=>{expect(measureOwnerFollowUp(action,[review(1),review(2)],now).ok).toBe(false); expect(measureOwnerFollowUp(action,[review(1),review(2),review(3)],new Date("2026-09-20")).ok).toBe(false);});
  it("refuses changed/legacy metric versions",()=>{expect(measureOwnerFollowUp({...action,metricVersion:null},[review(1),review(2),review(3)],now).ok).toBe(false);expect(measureOwnerFollowUp({...action,modelVersion:"old"},[],now).ok).toBe(false);});
  it("excludes weak, rejected, duplicate and different-model reviews from both denominators",()=>{const weak=review(1,true);weak.analysis.confidence=0.1;const rejected=review(2,true);rejected.analysis.humanStatus="rejected";const other=review(3);other.analysis.modelVersion="other"; const valid=review(4,true);expect(calculateNegativeBaseline([weak,rejected,other,valid,valid],"service",{start:"2026-09-02",end:"2026-09-30"})).toEqual({reviewCount:1,negativeMentions:1,negativeRate:1});});
});
