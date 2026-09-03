import { createHash, randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  isSameOriginRequest,
  parseComparisonVoteInput,
  submitComparisonVote,
  type ComparisonVoteIdentity,
} from "@/lib/nabz/vote-contract";
import {
  ComparisonVoteRepositoryError,
  createSupabaseComparisonVoteRepository,
} from "@/lib/nabz/supabase-vote-repository";

export const runtime = "nodejs";

const ROUTE = "POST /api/nabz/votes";
const ANONYMOUS_COOKIE = "nzr_nabz_session";
const ANONYMOUS_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const MAX_REQUEST_BYTES = 4 * 1024;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const MAX_RATE_BUCKETS = 10_000;
const rateBuckets = new Map<string, number[]>();

function json(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function allow(identityKey: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  if (!rateBuckets.has(identityKey) && rateBuckets.size >= MAX_RATE_BUCKETS) {
    for (const [key, timestamps] of rateBuckets) {
      if (timestamps.every((timestamp) => timestamp <= cutoff)) {
        rateBuckets.delete(key);
      }
    }
    while (rateBuckets.size >= MAX_RATE_BUCKETS) {
      const oldestKey = rateBuckets.keys().next().value;
      if (typeof oldestKey !== "string") {
        break;
      }
      rateBuckets.delete(oldestKey);
    }
  }

  const recent = (rateBuckets.get(identityKey) ?? []).filter(
    (timestamp) => timestamp > cutoff,
  );
  if (recent.length >= RATE_LIMIT) {
    rateBuckets.set(identityKey, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(identityKey, recent);
  return true;
}

function validAnonymousToken(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{32}$/.test(value));
}

function hashAnonymousToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function networkRateKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0].trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return hashAnonymousToken(address.slice(0, 128));
}

function anonymousIdentity(request: NextRequest): {
  identity: ComparisonVoteIdentity;
  rawToken: string;
  isNew: boolean;
} {
  const existing = request.cookies.get(ANONYMOUS_COOKIE)?.value;
  const isNew = !validAnonymousToken(existing);
  const rawToken = isNew ? randomBytes(24).toString("base64url") : existing;
  return {
    identity: {
      kind: "anonymous",
      databaseSessionId: hashAnonymousToken(rawToken),
    },
    rawToken,
    isNew,
  };
}

async function readJson(request: Request): Promise<
  | { ok: true; value: unknown }
  | { ok: false; response: NextResponse }
> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") {
    return {
      ok: false,
      response: json({ ok: false, error: "فرمت درخواست باید JSON باشد." }, 415),
    };
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return {
      ok: false,
      response: json({ ok: false, error: "درخواست بیش از حد بزرگ است." }, 413),
    };
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
    return {
      ok: false,
      response: json({ ok: false, error: "درخواست بیش از حد بزرگ است." }, 413),
    };
  }

  try {
    return { ok: true, value: JSON.parse(rawBody) as unknown };
  } catch {
    return {
      ok: false,
      response: json({ ok: false, error: "بدنه JSON معتبر نیست." }, 400),
    };
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return json({ ok: false, error: "مبدأ درخواست معتبر نیست." }, 403);
  }

  const body = await readJson(request);
  if (!body.ok) {
    return body.response;
  }

  const parsed = parseComparisonVoteInput(body.value);
  if (!parsed.ok) {
    return json(
      { ok: false, error: "اطلاعات رأی معتبر نیست.", issues: parsed.issues },
      400,
    );
  }

  let identityKind: "user" | "anonymous" | "unresolved" = "unresolved";
  try {
    const session = await getSession();
    let anonymous: ReturnType<typeof anonymousIdentity> | null = null;
    let identity: ComparisonVoteIdentity;
    if (session) {
      identity = { kind: "user", userId: session.id };
    } else {
      anonymous = anonymousIdentity(request);
      identity = anonymous.identity;
    }
    identityKind = identity.kind;
    const identityKey =
      identity.kind === "user"
        ? `user:${identity.userId}`
        : `anonymous:${identity.databaseSessionId}`;

    if (
      !allow(identityKey) ||
      !allow(`network:${networkRateKey(request)}`)
    ) {
      return json(
        { ok: false, error: "تعداد رأی‌ها زیاد شده؛ یک دقیقه دیگر تلاش کن." },
        429,
      );
    }

    const result = await submitComparisonVote(
      parsed.value,
      identity,
      createSupabaseComparisonVoteRepository(),
    );

    if (!result.ok) {
      return json(
        { ok: false, error: "این کسب‌وکارها هنوز مجوز نمایش در نبض رشت را ندارند." },
        422,
      );
    }

    const response = json(
      {
        ok: true,
        stored: result.status === "inserted",
        duplicate: result.status === "duplicate",
      },
      result.status === "inserted" ? 201 : 200,
    );

    if (anonymous?.isNew) {
      response.cookies.set(ANONYMOUS_COOKIE, anonymous.rawToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/api/nabz",
        maxAge: ANONYMOUS_COOKIE_MAX_AGE,
        priority: "medium",
      });
    }

    return response;
  } catch (error: unknown) {
    console.error("[nabz-votes] persistence failed", {
      route: ROUTE,
      identityKind,
      stage:
        error instanceof ComparisonVoteRepositoryError
          ? error.stage
          : "unexpected",
    });
    return json(
      { ok: false, error: "ثبت رأی فعلاً ممکن نیست؛ کمی بعد دوباره تلاش کن." },
      503,
    );
  }
}
