import { isLoginEnabled, isStaging } from "@/lib/auth/login-policy";
import { pushRuntimeReady } from "@/lib/push/server";
import { stagingDatabase } from "@/lib/staging/database";

export const dynamic = "force-dynamic";

/** Operational configuration only; never claims SMS or device delivery. */
export async function GET() {
  if (!isStaging()) return new Response(null, { status: 404 });
  let stateStore = "unavailable";
  try {
    const db = await stagingDatabase();
    const row = await db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE name IN ('otp_challenges','rate_limits','push_subscriptions')").first<{ count: number }>();
    if (row?.count === 3) stateStore = "ok";
  } catch { console.error("[services/status] staging state store unavailable"); }
  return Response.json({
    environment: "staging",
    sms: isLoginEnabled() && stateStore === "ok" ? "configured" : "unconfigured",
    gemini: process.env.GEMINI_API_KEY?.trim() ? "configured" : "unconfigured",
    push: pushRuntimeReady() && stateStore === "ok" ? "configured" : "unconfigured",
    stateStore,
    statusKind: "configuration-only",
  }, { headers: { "Cache-Control": "no-store" } });
}
