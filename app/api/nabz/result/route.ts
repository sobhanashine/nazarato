import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseNabzBusinessPool } from "@/lib/nabz/supabase-business-pool";
import { COMPARISON_SCENARIOS, isSameOriginRequest, type ComparisonScenario } from "@/lib/nabz/vote-contract";
import { buildRealResult } from "@/lib/nabz/real-recommendation";
import { getOwnRealChoices, getRealReviewEvidence, loadRealTaste, saveRealTaste } from "@/lib/nabz/real-result-store";
import { NABZ_ANONYMOUS_COOKIE, hashAnonymousToken, validAnonymousToken } from "@/lib/nabz/anonymous-identity";

export const runtime = "nodejs";
function json(body: unknown, status = 200) { return NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}}); }

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return json({ok:false,reason:"unauthenticated"},401);
    return json({ok:true,profile:await loadRealTaste(session.id)});
  } catch {
    console.error("[nabz-result] private restore unavailable",{route:"GET /api/nabz/result"});
    return json({ok:false,message:"بازیابی سلیقه فعلاً ممکن نیست."},503);
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return json({ok:false,message:"مبدأ درخواست معتبر نیست."},403);
  if (request.headers.get("content-type")?.split(";",1)[0].trim() !== "application/json") return json({ok:false},415);
  const raw = await request.text();
  if (Buffer.byteLength(raw,"utf8") > 1024) return json({ok:false},413);
  let payload: unknown;
  try { payload = JSON.parse(raw) as unknown; } catch { return json({ok:false},400); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return json({ok:false},400);
  const body = payload as Record<string,unknown>;
  if (Object.keys(body).some(key => key !== "scenario" && key !== "save") || !COMPARISON_SCENARIOS.includes(body.scenario as ComparisonScenario) || (body.save !== undefined && typeof body.save !== "boolean")) return json({ok:false,message:"درخواست نتیجه معتبر نیست."},400);
  const scenario = body.scenario as ComparisonScenario;
  try {
    const session = await getSession();
    if (body.save && !session) return json({ok:false,reason:"unauthenticated",message:"برای ذخیره بین دستگاه‌ها وارد حساب شو؛ ورود عمومی هنوز در حال آماده‌سازی است."},401);
    const token = request.cookies.get(NABZ_ANONYMOUS_COOKIE)?.value;
    let choices = session ? await getOwnRealChoices({userId:session.id},scenario) : [];
    // The opaque cookie proves access to this anonymous session. Its votes are
    // not reassigned or exposed to the owner's dashboard when a summary is saved.
    if (choices.length < 5 && validAnonymousToken(token)) choices = await getOwnRealChoices({anonymousId:hashAnonymousToken(token)},scenario);
    if (choices.length < 5) return json({ok:false,message:"ابتدا پنج انتخاب واقعی را تکمیل کن."},422);
    const pool = await getSupabaseNabzBusinessPool();
    if (pool.status === "unavailable") return json({ok:false,message:"دریافت داده ممکن نیست؛ انتخاب‌ها محفوظ‌اند."},503);
    const reviews = await getRealReviewEvidence(pool.businesses.map(b => b.id));
    const result = buildRealResult({businesses:pool.businesses,choices,reviews,scenario});
    if (!result) return json({ok:false,message:"داده یا مجوز مکان‌ها تغییر کرده؛ یک جلسه تازه شروع کن."},422);
    if (body.save && session) await saveRealTaste(session.id,result.profile);
    return json({ok:true,result,saved:Boolean(body.save && session)});
  } catch {
    console.error("[nabz-result] evidence/save unavailable",{route:"POST /api/nabz/result",scenario,save:body.save === true});
    return json({ok:false,message:"نتیجه یا ذخیره‌سازی فعلاً در دسترس نیست؛ انتخاب‌ها محفوظ‌اند، دوباره تلاش کن."},503);
  }
}
