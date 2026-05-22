"use client";

/**
 * Client-side session status, read from `GET /api/auth/me`.
 *
 * Why a fetch and not a server read: `Header` renders on otherwise-static
 * pages (`/`, `/blog`, `/company/[slug]`). Reading the session cookie on the
 * server would opt every one of those routes into dynamic rendering. Fetching
 * from the client keeps the pages static and the header hydrates the auth bit.
 *
 * Re-fetches on every mount so the state is fresh right after a login/logout
 * navigation; concurrent callers on the same page share one in-flight request.
 */
import { useEffect, useState } from "react";

export type SessionStatus = { loggedIn: boolean; name: string | null };

const SIGNED_OUT: SessionStatus = { loggedIn: false, name: null };

// Dedupes the header + mobile-menu calls that fire together on one page.
// Cleared once settled, so the next navigation gets a fresh read.
let inflight: Promise<SessionStatus> | null = null;

function fetchStatus(): Promise<SessionStatus> {
  if (!inflight) {
    inflight = fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<SessionStatus>) : SIGNED_OUT))
      .catch(() => SIGNED_OUT)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Current session status, or `null` while the first fetch is in flight. */
export function useSessionStatus(): SessionStatus | null {
  const [status, setStatus] = useState<SessionStatus | null>(null);

  useEffect(() => {
    let alive = true;
    fetchStatus().then((s) => {
      if (alive) setStatus(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  return status;
}
