import { NextResponse } from "next/server";
import {
  buildNabzDuel,
  parseNabzDuelQuery,
} from "../../../../lib/nabz/duel-deck";
import { getSupabaseNabzBusinessPool } from "../../../../lib/nabz/supabase-business-pool";

export const runtime = "nodejs";

const ROUTE = "GET /api/nabz/duel";

function json(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const parsed = parseNabzDuelQuery(new URL(request.url).searchParams);
  if (!parsed.ok) {
    return json(
      {
        ok: false,
        error: "درخواست دوئل معتبر نیست.",
        issues: parsed.issues,
      },
      400,
    );
  }

  try {
    const pool = await getSupabaseNabzBusinessPool();
    if (pool.status === "unavailable") {
      return json(
        {
          ok: false,
          error: "ساخت دوئل واقعی فعلاً ممکن نیست؛ کمی بعد دوباره تلاش کن.",
        },
        503,
      );
    }

    const result = buildNabzDuel({
      businesses: pool.businesses,
      scenario: parsed.value.scenario,
      round: parsed.value.round,
    });
    return json({ ok: true, ...result }, 200);
  } catch (error: unknown) {
    console.error("[nabz-duel] read failed", {
      route: ROUTE,
      error: error instanceof Error ? error.message : "unknown error",
    });
    return json(
      {
        ok: false,
        error: "ساخت دوئل واقعی فعلاً ممکن نیست؛ کمی بعد دوباره تلاش کن.",
      },
      503,
    );
  }
}
