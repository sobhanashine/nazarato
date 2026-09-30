import { describe, expect, test } from "vitest";
import { isChatMessage, isChatPayload, parseSources } from "./route";

describe("isChatMessage", () => {
  test("accepts a valid message", () => {
    expect(isChatMessage({ role: "user", text: "سلام" })).toBe(true);
    expect(isChatMessage({ role: "model", text: "پاسخ هوش مصنوعی" })).toBe(true);
  });

  test("rejects invalid role type", () => {
    expect(isChatMessage({ role: "system", text: "نامعتبر" })).toBe(false);
    expect(isChatMessage({ role: "", text: "نامعتبر" })).toBe(false);
  });

  test("rejects non-string or empty text", () => {
    expect(isChatMessage({ role: "user", text: "" })).toBe(false);
    expect(isChatMessage({ role: "user", text: 123 })).toBe(false);
    expect(isChatMessage({ role: "user" })).toBe(false);
  });
});

describe("isChatPayload", () => {
  test("accepts valid chat payload without history", () => {
    expect(isChatPayload({ message: "خرید از ایرانی کارت" })).toBe(true);
  });

  test("accepts valid chat payload with history", () => {
    expect(
      isChatPayload({
        message: "آیا ایمن است؟",
        history: [
          { role: "user", text: "ایرانی کارت چیست؟" },
          { role: "model", text: "یک شرکت پرداخت مالی..." }
        ]
      })
    ).toBe(true);
  });

  test("rejects empty or whitespace-only messages", () => {
    expect(isChatPayload({ message: "" })).toBe(false);
    expect(isChatPayload({ message: "   " })).toBe(false);
  });

  test("rejects too long message (>500 chars)", () => {
    const longMessage = "a".repeat(501);
    expect(isChatPayload({ message: longMessage })).toBe(false);
  });

  test("rejects too long history (>20 messages)", () => {
    const history = Array(21).fill({ role: "user", text: "سلام" });
    expect(isChatPayload({ message: "تست", history })).toBe(false);
  });

  test("rejects history with invalid messages", () => {
    expect(
      isChatPayload({
        message: "تست",
        history: [{ role: "system", text: "نامعتبر" }]
      })
    ).toBe(false);
  });
});

describe("parseSources", () => {
  test("extracts links and titles from grounding HTML markup", () => {
    const html = `
      <div class="carousel">
        <a class="chip" href="https://vertexaisearch.cloud.google.com/grounding-api-redirect/url1">ایرانی کارت چیست</a>
        <a class="chip" href="https://vertexaisearch.cloud.google.com/grounding-api-redirect/url2">نظرات کاربران ایرانی کارت</a>
      </div>
    `;
    const result = parseSources(html);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/url1",
      title: "ایرانی کارت چیست"
    });
    expect(result[1]).toEqual({
      url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/url2",
      title: "نظرات کاربران ایرانی کارت"
    });
  });

  test("deduplicates sources by URL", () => {
    const html = `
      <a href="https://site.com/link">تست ۱</a>
      <a href="https://site.com/link">تست ۲ (تکراری)</a>
    `;
    const result = parseSources(html);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      url: "https://site.com/link",
      title: "تست ۱"
    });
  });

  test("returns empty array for HTML without links", () => {
    const html = `<div class="container"><p>بدون لینک</p></div>`;
    expect(parseSources(html)).toEqual([]);
  });
});
