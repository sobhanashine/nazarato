import { describe, expect, it } from "vitest";
import { normalizePersianText } from "./persian-normalizer";

describe("normalizePersianText", () => {
  it("normalizes Arabic glyphs, digits, diacritics, tatweel, and whitespace", () => {
    expect(
      normalizePersianText("  كافِيـه\tشماره ۱۲٣  خیلی   خوب بود  "),
    ).toBe("کافیه شماره 123 خیلی خوب بود");
  });

  it("keeps Persian half-spaces stable and is idempotent", () => {
    const once = normalizePersianText("بی ‌ کیفیت نبود؛ واقعاً می‌ارزید");

    expect(once).toBe("بی‌کیفیت نبود؛ واقعا می‌ارزید");
    expect(normalizePersianText(once)).toBe(once);
  });

  it("does not erase meaningful Persian hamza characters", () => {
    expect(normalizePersianText("مسئول مؤدب")).toBe("مسئول مؤدب");
  });
});
