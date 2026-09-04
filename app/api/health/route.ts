import { NextResponse } from "next/server";
import { buildHealthReport } from "@/lib/release/health-report";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROUTE = "GET /api/health";

async function probeDatabase(): Promise<void> {
  try {
    const { error } = await supabaseAdmin()
      .from("businesses")
      .select("id")
      .limit(1);
    if (error) throw error;
  } catch (error: unknown) {
    console.error("[health] database probe failed", {
      route: ROUTE,
      errorType: error instanceof Error ? error.name : "unknown",
    });
    throw error;
  }
}

export async function GET(): Promise<NextResponse> {
  const report = await buildHealthReport({
    env: process.env,
    // The homepage still renders named fictional fixtures. This must change in
    // code when the real pilot dataset is wired; an env toggle alone must never
    // be able to report a fictional deployment as pilot-ready.
    dataMode: "fictional-demo",
    probeDatabase,
  });

  return NextResponse.json(report, {
    status: report.ok ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
