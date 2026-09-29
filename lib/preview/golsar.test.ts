import { describe, expect, it } from "vitest";
import { experienceKey, filterGolsarCafes, isLocalGolsarPreview, parseGolsarExport, parseLocalExperience, saveLocalExperience, submitLocalPreviewReview, validateExperience } from "./golsar";

const row = {
  google_place_id: "test-cafe-place-123", name: "کافه وُک", address_readable: "Rasht, Tohid Blvd",
  latitude: 37.30, longitude: 49.58, source_url: "https://www.google.com/maps/search/?query=cafe",
  captured_at: "2026-09-25T00:28:00.000Z", source_provider: "google_maps_via_apify",
  permission_basis: "unknown", publication_status: "not_approved", pilot_category_proposed: "cafe",
};

describe("Golsar local preview boundary", () => {
  it("opens only opted-in development on a loopback host", () => {
    expect(isLocalGolsarPreview("development", "true", "127.0.0.1:3016")).toBe(true);
    for (const [env, flag, host] of [["production", "true", "localhost"], ["development", "false", "localhost"], ["development", "true", "nazarato.ir"], ["development", "true", "localhost.evil.com"]]) {
      expect(isLocalGolsarPreview(env, flag, host)).toBe(false);
    }
  });
  it("projects only factual candidate fields, dropping ratings, reviews and unsafe contacts", () => {
    const [cafe] = parseGolsarExport({ items: [{ ...row, rating: 5, reviews: ["copied"], image: "secret", phone: "javascript:bad", instagram: "https://instagram.com.evil.com/cafe" }] });
    expect(cafe.name).toBe("کافه وُک");
    expect(cafe.phone).toBeNull();
    expect(cafe.instagram).toBeNull();
    expect(cafe).not.toHaveProperty("rating");
    expect(cafe).not.toHaveProperty("reviews");
    expect(cafe).not.toHaveProperty("image");
  });
  it("rejects duplicate identity, invalid coordinates and unexpectedly approved sources", () => {
    expect(() => parseGolsarExport({ items: [row, row] })).toThrow();
    for (const patch of [{ latitude: NaN }, { latitude: 30 }, { publication_status: "approved" }, { permission_basis: "owner_consent" }, { source_url: "javascript:alert(1)" }]) {
      expect(() => parseGolsarExport({ items: [{ ...row, ...patch }] })).toThrow();
    }
  });
  it("finds a Persian name without diacritics and a Persian street from the English address", () => {
    const cafes = parseGolsarExport({ items: [row] });
    expect(filterGolsarCafes(cafes, "وك", "توحید")).toHaveLength(1);
    expect(filterGolsarCafes(cafes, "وك", "دیلمان")).toHaveLength(0);
    expect(filterGolsarCafes(cafes, "ناموجود", "")).toHaveLength(0);
  });
});

describe("browser-only experience", () => {
  const experience = { version: 1, cafeId: row.google_place_id, rating: 4, body: "این متن برای تست تجربه است", updatedAt: "2026-09-26T12:00:00Z" };
  it("restores a valid experience only for the matching cafe", () => {
    expect(parseLocalExperience(JSON.stringify(experience), row.google_place_id)).toEqual(experience);
    expect(parseLocalExperience(JSON.stringify(experience), "different")).toBeNull();
  });
  it("persists a restorable record to the cafe-specific key", () => {
    const entries = new Map<string, string>();
    const result = saveLocalExperience({ setItem: (key, value) => { entries.set(key, value); } }, row.google_place_id, 4, experience.body);
    expect(result.ok).toBe(true);
    expect(parseLocalExperience(entries.get(experienceKey(row.google_place_id)) ?? null, row.google_place_id)?.body).toBe(experience.body);
  });
  it("reports quota or permission failure without success and rejects invalid writes", () => {
    const storage = { setItem: () => { throw new Error("Quota exceeded"); } };
    const result = saveLocalExperience(storage, row.google_place_id, 4, experience.body);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("ذخیره انجام نشد");
    let called = false;
    expect(saveLocalExperience({ setItem: () => { called = true; } }, row.google_place_id, 0, experience.body).ok).toBe(false);
    expect(called).toBe(false);
  });
  it("rejects stale format, corrupt storage, invalid rating and empty text", () => {
    expect(parseLocalExperience("broken", row.google_place_id)).toBeNull();
    for (const patch of [{ version: 0 }, { rating: 6 }, { rating: 1.5 }, { body: " " }, { updatedAt: "bad" }]) {
      expect(parseLocalExperience(JSON.stringify({ ...experience, ...patch }), row.google_place_id)).toBeNull();
    }
    expect(validateExperience(0, experience.body)).toContain("امتیاز");
    expect(validateExperience(4, "x".repeat(2001))).toContain("۲۰۰۰");
  });
});


describe("shared review wizard local submission", () => {
  function form(slug = row.google_place_id, rating = "4", body = "تجربهٔ آزمایشی در کافه") {
    const data = new FormData();
    data.set("slug", slug); data.set("rating", rating); data.set("body", body);
    return data;
  }
  it("stores the wizard payload under the selected cafe identity", () => {
    const entries = new Map<string, string>();
    const result = submitLocalPreviewReview({ setItem: (key, value) => { entries.set(key, value); } }, row.google_place_id, form());
    expect(result.ok).toBe(true);
    expect(parseLocalExperience(entries.get(experienceKey(row.google_place_id)) ?? null, row.google_place_id)?.rating).toBe(4);
  });
  it("refuses a different cafe before writing", () => {
    let called = false;
    expect(submitLocalPreviewReview({ setItem: () => { called = true; } }, row.google_place_id, form("another-cafe")).ok).toBe(false);
    expect(called).toBe(false);
  });
  it("rejects malformed wizard fields before writing", () => {
    let called = false;
    const storage = { setItem: () => { called = true; } };
    for (const data of [form(row.google_place_id, "NaN"), form(row.google_place_id, "4", "short"), form(row.google_place_id, "6")]) {
      expect(submitLocalPreviewReview(storage, row.google_place_id, data).ok).toBe(false);
    }
    expect(called).toBe(false);
  });
  it("returns a recoverable storage error to the same wizard", () => {
    const result = submitLocalPreviewReview({ setItem: () => { throw new Error("Quota exceeded"); } }, row.google_place_id, form());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("متن تو هنوز اینجاست");
  });
});
