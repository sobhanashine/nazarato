/**
 * `GET /api/auth/me` — current session status for client components.
 *
 * The session lives in an HTTP-only cookie, so client components (the header,
 * the mobile menu) cannot read it directly. They hit this route instead.
 *
 * Kept deliberately minimal: it returns only what the header needs to render
 * (`loggedIn` + display name) — never the phone or the user id.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    session
      ? { loggedIn: true, name: session.name }
      : { loggedIn: false, name: null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
