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
    dataMode: "production",
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
