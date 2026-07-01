/**
 * POST /api/chat — Streamed AI chat handler with custom DuckDuckGo/Jina crawler
 * and Google Search grounding fallback.
 *
 * Boundary discipline (per AGENTS.md):
 *  - Supports both logged-in and anonymous users, using separate rate limit tiers (15/min and 5/min).
 *  - Size-limits inputs and history to protect downstream API cost and latency.
 *  - Uses strong TypeScript narrowing from `unknown` at the API boundary.
 *  - Logs server errors with route and userId context; never bubbles upstream errors.
 *  - Streams SSE JSON packets containing incremental text, sources list, and errors.
 */

import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "../../../lib/auth/session";

export const runtime = "nodejs";
export const maxDuration = 60; // Max execution timeout for streaming response

const LIMIT_ANON = 5;         // 5 requests per window for anonymous users
const LIMIT_USER = 15;        // 15 requests per window for logged-in users
const RATE_WINDOW_MS = 60_000; // 1 minute window

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent`;

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface SearchSource {
  title: string;
  url: string;
}

const rateBuckets = new Map<string, number[]>();

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const hits = (rateBuckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    rateBuckets.set(key, hits);
    return false;
  }
  hits.push(now);
  rateBuckets.set(key, hits);
  return true;
}

function getRateLimitKey(session: SessionUser | null, req: Request): string {
  if (session?.id) return `user_${session.id}`;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anon_ip";
  return `ip_${ip}`;
}

export function isChatMessage(v: unknown): v is ChatMessage {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    (o.role === "user" || o.role === "model") &&
    typeof o.text === "string" &&
    o.text.length > 0 &&
    o.text.length <= 4000
  );
}

export function isChatPayload(v: unknown): v is { message: string; history?: ChatMessage[] } {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.message !== "string" || o.message.trim().length === 0 || o.message.length > 500) {
    return false;
  }
  if (o.history !== undefined) {
    if (!Array.isArray(o.history)) return false;
    if (o.history.length > 20) return false; // Max history length of 20 to prevent context bloat
    return o.history.every(isChatMessage);
  }
  return true;
}

/** Parses search result chips from Google's renderedContent HTML */
export function parseSources(html: string): SearchSource[] {
  const sources: SearchSource[] = [];
  const regex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
    if (url && title) {
      sources.push({ url, title });
    }
  }
  const seen = new Set<string>();
  return sources.filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

/** Background web search and crawler using Jina Reader and DuckDuckGo HTML search. */
async function crawlWeb(query: string): Promise<{ text: string; sources: SearchSource[] }> {
  // Add keywords to focus DuckDuckGo search on store reviews
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + " نظرات شکایت خریداران")}`;
  const jinaSearchUrl = `https://r.jina.ai/${searchUrl}`;

  try {
    const res = await fetch(jinaSearchUrl, {
      signal: AbortSignal.timeout(6000) // 6s timeout for the initial search page
    });
    if (!res.ok) return { text: "", sources: [] };
    const markdownSearch = await res.text();

    const links: SearchSource[] = [];
    // DuckDuckGo redirect link regex in Jina markdown output
    const ddgRegex = /\[([^\]]+)\]\((https:\/\/duckduckgo\.com\/l\/\?uddg=([^&)]+)[^)]*)\)/g;
    let match;
    while ((match = ddgRegex.exec(markdownSearch)) !== null) {
      const title = match[1].trim();
      const rawUrl = match[3];
      try {
        const decodedUrl = decodeURIComponent(rawUrl);
        if (
          decodedUrl.startsWith("http") &&
          !decodedUrl.includes("duckduckgo.com") &&
          !links.some((l) => l.url === decodedUrl) &&
          title.length > 3
        ) {
          links.push({ title, url: decodedUrl });
        }
      } catch {
        // Skip URL decode failures
      }
    }

    // Direct markdown links [Title](URL) fallback
    if (links.length === 0) {
      const directRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
      while ((match = directRegex.exec(markdownSearch)) !== null) {
        const title = match[1].trim();
        const url = match[2];
        if (
          !url.includes("duckduckgo.com") &&
          !links.some((l) => l.url === url) &&
          title.length > 3
        ) {
          links.push({ title, url });
        }
      }
    }

    // Crawl top 3 target review links in parallel using Jina Reader
    const targetLinks = links.slice(0, 3);
    if (targetLinks.length === 0) return { text: "", sources: [] };

    const crawlPromises = targetLinks.map(async (link) => {
      try {
        const crawlRes = await fetch(`https://r.jina.ai/${link.url}`, {
          signal: AbortSignal.timeout(6000) // 6s timeout per page crawl
        });
        if (crawlRes.ok) {
          const content = await crawlRes.text();
          // Extract first 1500 characters to prevent token overflow
          return `منبع: ${link.title} (آدرس: ${link.url})\nمحتوا خزش شده:\n${content.slice(0, 1500)}\n---`;
        }
      } catch (err) {
        console.error(`[crawl-api] Failed to crawl ${link.url}`, err);
      }
      return "";
    });

    const crawledPages = await Promise.all(crawlPromises);
    const combinedText = crawledPages.filter(Boolean).join("\n\n");

    return {
      text: combinedText,
      sources: targetLinks
    };
  } catch (err) {
    console.error("[crawl-api] Search crawler failed", err);
    return { text: "", sources: [] };
  }
}

export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  
  // Rate-limiting
  const rateLimitKey = getRateLimitKey(session, req);
  const limit = session ? LIMIT_USER : LIMIT_ANON;
  if (!checkRateLimit(rateLimitKey, limit)) {
    return NextResponse.json(
      { error: "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً لحظاتی صبر کنید." },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[chat-api] GEMINI_API_KEY is not set");
    return NextResponse.json(
      { error: "سرویس چت هوشمند در حال حاضر در دسترس نیست." },
      { status: 503 }
    );
  }

  // Parse and validate payload
  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json(
      { error: "درخواست نامعتبر است." },
      { status: 400 }
    );
  }

  if (!isChatPayload(body)) {
    return NextResponse.json(
      { error: "داده‌های ورودی نامعتبر هستند یا پیام بسیار طولانی است." },
      { status: 400 }
    );
  }

  const { message, history = [] } = body;

  // Run the background search and crawler
  const { text: crawledText, sources: crawledSources } = await crawlWeb(message);
  const hasCrawlData = crawledText.length > 100 && crawledSources.length > 0;

  // Prompt configuration: If we have crawled data, instruct the model to use it.
  // Otherwise, fall back to Google Search grounding.
  const systemInstructionWithCrawl =
    "تو «دستیار هوشمند نظراتو» هستی؛ یک هوش مصنوعی راهنما برای پلتفرم نظراتو (Nazarato) که به سوالات کاربران درباره فروشگاه‌ها، سایت‌ها، و کسب‌وکارهای ایرانی پاسخ می‌دهد. " +
    "ما وب را خزش کرده و نظرات و تجربیات واقعی را استخراج کرده‌ایم. اطلاعات خزش شده در پیام کاربر تزریق شده است. " +
    "باید پاسخ خود را دقیقاً بر اساس اطلاعات خزش شده بنویسی. باید نظرات و کامنت‌های خریداران واقعی را به تفکیک و دسته‌بندی منبع ارائه کنی. " +
    "پاسخ خود را حتماً به زبان فارسی و با استفاده از اعداد فارسی (۱۲۳۴۵۶۷۸۹۰) ارائه کن. پاسخ خود را با بخش‌های پررنگ (Bold) زیر ساختاردهی کن:\n" +
    "**بررسی اعتبار و شهرت کلی**\n" +
    "**نقاط قوت**\n" +
    "**نقاط ضعف و شکایت‌های رایج**\n" +
    "**نظرات و دیدگاه‌های خریداران (به تفکیک منبع)**\n" +
    "در بخش نظرات، کامنت‌ها را بر اساس منبع آن‌ها (مثلاً دیجی‌کالا، ترب، باسلام یا نی‌نی‌سایت) دسته‌بندی کن و هر کدام را تحت یک زیرعنوان با علامت ### قرار بده (مثال: ### نظرات دیجی‌کالا). هر نظر را به صورت بلاک‌کوت با علامت > شروع کن (مثال: > «من راضی بودم» - منبع: ترب).\n" +
    "**توصیه نهایی نظراتو**";

  const systemInstructionWithGrounding = 
    "تو «دستیار هوشمند نظراتو» هستی؛ یک هوش مصنوعی راهنما برای پلتفرم نظراتو (Nazarato) که به سوالات کاربران درباره فروشگاه‌ها، سایت‌ها، و کسب‌وکارهای ایرانی پاسخ می‌دهد. " +
    "باید با استفاده از ابزار جستجوی گوگل (Google Search) در وب، اعتبار، نظرات مثبت، شکایت‌ها، و سابقه‌ی فروشگاه را جستجو کنی. " +
    "پاسخ‌های تو باید کاملاً بی‌طرفانه، واقعی و بر اساس نظرات خریداران واقعی در اینترنت باشد. در صورتی که شکایاتی وجود دارد، صادقانه هشدار بده. " +
    "پاسخ خود را حتماً به زبان فارسی و با استفاده از اعداد فارسی (۱۲۳۴۵۶۷۸۹۰) ارائه کن. پاسخ خود را با بخش‌های پررنگ (Bold) زیر ساختاردهی کن:\n" +
    "**بررسی اعتبار و شهرت کلی**\n" +
    "**نقاط قوت**\n" +
    "**نقاط ضعف و شکایت‌های رایج**\n" +
    "**نظرات و دیدگاه‌های خریداران (به تفکیک منبع)**\n" +
    "در بخش نظرات خریداران، کامنت‌ها را بر اساس منبع آن‌ها (مثلاً دیجی‌کالا، ترب، یا باسلام) دسته‌بندی کن و هر کدام را تحت یک زیرعنوان با علامت ### قرار بده (مثال: ### نظرات دیجی‌کالا). هر نظر را به صورت بلاک‌کوت با علامت > شروع کن (مثال: > «من راضی بودم» - منبع: دیجی‌کالا).\n" +
    "**توصیه نهایی نظراتو**\n" +
    "اگر در جستجوها اطلاعات کافی در مورد فروشگاه یافت نشد، محترمانه اعلام کن که اطلاعات کافی وجود ندارد.";

  // Prepare contents structure
  let contents = [];
  if (hasCrawlData) {
    // Inject crawled text context directly into the current query part
    contents = [
      ...history.map((h) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      })),
      {
        role: "user",
        parts: [
          {
            text: 
              `سوال کاربر: «${message}»\n\n` +
              `اطلاعات و کامنت‌های خزش شده زنده وب:\n\n${crawledText}\n\n` +
              `لطفاً طبق دستورالعمل سیستم، این اطلاعات خزش شده را تحلیل کرده و پاسخ نهایی را در بخش‌های مشخص شده بده.`
          }
        ]
      }
    ];
  } else {
    contents = [
      ...history.map((h) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];
  }

  const geminiPayload = {
    contents,
    systemInstruction: {
      parts: [{ text: hasCrawlData ? systemInstructionWithCrawl : systemInstructionWithGrounding }]
    },
    // Use Google search grounding only as fallback if our crawler returned empty
    tools: hasCrawlData ? [] : [{ google_search: {} }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2500
    }
  };

  let geminiResponse: Response;
  try {
    geminiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });
  } catch (err) {
    console.error("[chat-api] Fetch to Gemini failed", {
      userId: session?.id,
      err: err instanceof Error ? err.message : String(err)
    });
    return NextResponse.json(
      { error: "خطا در ارتباط با سرور هوش مصنوعی." },
      { status: 502 }
    );
  }

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text().catch(() => "");
    console.error("[chat-api] Gemini returned non-2xx status", {
      status: geminiResponse.status,
      body: errorText.slice(0, 500)
    });
    return NextResponse.json(
      { error: "سرویس چت با خطا مواجه شد. لطفاً دوباره تلاش کنید." },
      { status: 502 }
    );
  }

  const geminiStream = geminiResponse.body;
  if (!geminiStream) {
    return NextResponse.json(
      { error: "جریان پاسخ صادر نشد." },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const reader = geminiStream.getReader();
  
  const customStream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      let parsedSourcesSent = false;
      const textDecoder = new TextDecoder();

      // If we have custom crawled sources, stream them to the client immediately!
      if (hasCrawlData && crawledSources.length > 0) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "sources", content: crawledSources })}\n\n`)
        );
        parsedSourcesSent = true;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += textDecoder.decode(value, { stream: true });

          while (true) {
            const firstBrace = buffer.indexOf("{");
            if (firstBrace === -1) break;

            let depth = 0;
            let closedIndex = -1;
            let inString = false;
            let escaped = false;

            for (let i = firstBrace; i < buffer.length; i++) {
              const char = buffer[i];
              if (escaped) {
                escaped = false;
                continue;
              }
              if (char === "\\") {
                escaped = true;
                continue;
              }
              if (char === '"') {
                inString = !inString;
                continue;
              }
              if (!inString) {
                if (char === "{") depth++;
                else if (char === "}") {
                  depth--;
                  if (depth === 0) {
                    closedIndex = i;
                    break;
                  }
                }
              }
            }

            if (closedIndex === -1) break;

            const jsonStr = buffer.slice(firstBrace, closedIndex + 1);
            buffer = buffer.slice(closedIndex + 1);

            try {
              const parsed = JSON.parse(jsonStr);
              
              const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "text", content: textChunk })}\n\n`)
                );
              }

              // Fallback sources extraction from Google Grounding if we didn't crawl custom sources
              const metadata = parsed.candidates?.[0]?.groundingMetadata;
              if (metadata && !parsedSourcesSent) {
                const renderedHtml = metadata.searchEntryPoint?.renderedContent;
                if (renderedHtml) {
                  const sources = parseSources(renderedHtml);
                  if (sources.length > 0) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "sources", content: sources })}\n\n`)
                    );
                    parsedSourcesSent = true;
                  }
                }
              }
            } catch (err) {
              console.error("[chat-api] Failed to parse streaming JSON chunk", err);
            }
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      } catch (err) {
        console.error("[chat-api] Stream processing error", err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", content: "خطا در استریم اطلاعات چت." })}\n\n`)
        );
        controller.close();
      } finally {
        reader.releaseLock();
      }
    }
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
