/**
 * POST /api/transcribe — fa-IR audio → text via Gemini 2.5 Flash (#90 follow-up).
 *
 * Why this exists: Chrome's `webkitSpeechRecognition` for `fa-IR` proxies audio
 * to a Google STT endpoint that is unreachable from inside Iran (the surfaced
 * error is `network`, hence "no internet" even when online). Gemini's
 * `generativelanguage.googleapis.com` does load from the target region, so we
 * post raw recorder audio through this server route and let Gemini transcribe.
 *
 * Boundary discipline (per AGENTS.md):
 *  - Auth re-checked here — a forged client call must not transcribe for free.
 *  - Size cap (≤ 1MB) so we don't relay arbitrary audio to a paid endpoint.
 *  - Per-user rate limit (in-memory, ephemeral) so a single account can't
 *    drain the daily quota. Replace with a Supabase/Redis bucket when we
 *    horizontally scale beyond one Node process.
 *  - Errors are logged with route + userId context; user-facing messages stay
 *    Persian and never echo the upstream JSON.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 1 * 1024 * 1024; // 1 MB → ~8 min of opus@16kbps
const RATE_LIMIT = 10; // requests…
const RATE_WINDOW_MS = 60_000; // …per minute, per user

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Accept any `audio/*` subtype rather than a fixed whitelist. The whitelist
 * approach (issue #117) bounced real recordings from iOS Safari / some
 * Android WebViews that hand `MediaRecorder` a blob with an off-list mime
 * (e.g. `audio/x-m4a`, `audio/aac-adts`). Cost is already gated by auth +
 * 1MB size cap + per-user rate limit, and Gemini itself rejects malformed
 * audio downstream — the whitelist was over-defensive.
 */
function isAudioMime(mime: string): boolean {
  return mime.startsWith("audio/") && mime.length > "audio/".length;
}

const rateBuckets = new Map<string, number[]>();

function allow(userId: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const hits = (rateBuckets.get(userId) ?? []).filter((t) => t > cutoff);
  if (hits.length >= RATE_LIMIT) {
    rateBuckets.set(userId, hits);
    return false;
  }
  hits.push(now);
  rateBuckets.set(userId, hits);
  return true;
}

/** Strip the codec parameter; Gemini wants the bare type. */
function bareMime(full: string): string {
  return full.split(";")[0].trim().toLowerCase();
}

export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "نشست شما منقضی شده — دوباره وارد شو." },
      { status: 401 },
    );
  }

  if (!allow(session.id)) {
    return NextResponse.json(
      { error: "تعداد درخواست‌ها بیش از حد است — کمی صبر کن." },
      { status: 429 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[transcribe] GEMINI_API_KEY not set", { userId: session.id });
    return NextResponse.json(
      { error: "سرویس دیکته در حال حاضر در دسترس نیست." },
      { status: 503 },
    );
  }

  const fullType = req.headers.get("content-type") ?? "";
  const mime = bareMime(fullType);
  if (!isAudioMime(mime)) {
    console.warn("[transcribe] rejected non-audio content-type", {
      userId: session.id,
      received: fullType.slice(0, 120),
    });
    return NextResponse.json(
      { error: "فرمت صوتی پشتیبانی نمی‌شود." },
      { status: 415 },
    );
  }

  // Trust-but-verify: reject oversized uploads based on the declared
  // `Content-Length` BEFORE buffering. The post-read size check below is
  // the authoritative guard (Content-Length can lie), but the pre-check
  // saves us from buffering a malicious 1GB body into memory just to
  // reject it.
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    return NextResponse.json(
      { error: "فایل صوتی خیلی بزرگ است (حداکثر یک مگابایت)." },
      { status: 413 },
    );
  }

  const buf = await req.arrayBuffer();
  if (buf.byteLength === 0) {
    return NextResponse.json(
      { error: "فایل صوتی خالی است." },
      { status: 400 },
    );
  }
  if (buf.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { error: "فایل صوتی خیلی بزرگ است (حداکثر یک مگابایت)." },
      { status: 413 },
    );
  }

  const base64 = Buffer.from(buf).toString("base64");

  // Prompt is short on purpose — long instructions burn tokens and Gemini
  // already understands "transcribe". The "only the transcript" phrasing
  // suppresses meta-commentary like «این متن فارسی است:».
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Transcribe the following Persian (fa-IR) audio to Persian text. Output ONLY the transcript, no preface, no quotes, no explanation.",
          },
          { inline_data: { mime_type: mime, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 2048,
    },
  };

  let upstream: Response;
  try {
    upstream = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[transcribe] gemini fetch failed", {
      userId: session.id,
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "ارتباط با سرویس دیکته برقرار نشد." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    console.error("[transcribe] gemini non-2xx", {
      userId: session.id,
      status: upstream.status,
      body: text.slice(0, 500),
    });
    return NextResponse.json(
      { error: "سرویس دیکته پاسخ نداد. لطفاً دوباره تلاش کن." },
      { status: 502 },
    );
  }

  let payload: unknown;
  try {
    payload = await upstream.json();
  } catch (err) {
    console.error("[transcribe] gemini response not JSON", {
      userId: session.id,
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "پاسخ سرویس دیکته نامعتبر بود." },
      { status: 502 },
    );
  }

  const transcript = extractTranscript(payload);
  if (!transcript) {
    console.warn("[transcribe] empty transcript from gemini", {
      userId: session.id,
    });
    return NextResponse.json({ text: "" }, { status: 200 });
  }

  return NextResponse.json({ text: transcript }, { status: 200 });
}

/**
 * Pull the first text part out of Gemini's response shape, narrowing from
 * `unknown` at every hop so a schema change can't blow up the route.
 */
function extractTranscript(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return "";
  const first = candidates[0];
  if (!first || typeof first !== "object") return "";
  const content = (first as { content?: unknown }).content;
  if (!content || typeof content !== "object") return "";
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return "";
  const chunks: string[] = [];
  for (const p of parts) {
    if (p && typeof p === "object" && typeof (p as { text?: unknown }).text === "string") {
      chunks.push((p as { text: string }).text);
    }
  }
  return chunks.join("").trim();
}
