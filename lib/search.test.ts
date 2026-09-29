import { describe, expect, it, vi } from "vitest";
import { parseSearchParams, runSearch, searchCategories, suggestBusinesses } from "./search";
import type { Business } from "./data/businesses";
vi.mock("@/lib/supabase/server", () => ({ supabaseAdmin: vi.fn() }));
const wok: Business = { slug: "wok-place-123", name: "کافه وک", category: "کافه", city: "رشت", initial: "و", color: "#7B89FF", score: "—", reviews: "۰", reviewCount: 0, verified: false, searchText: "Wok بلوار توحید" };

describe("native search with an explicit local catalog", () => {
  it("never returns fixture suggestions or results for an empty catalog", () => {
    expect(runSearch(parseSearchParams({}, []), []).total).toBe(0);
    expect(suggestBusinesses("کافه", 6, [])).toEqual([]);
    expect(searchCategories([])).toEqual([]);
  });
  it("matches normalized Persian names and the stored street", () => {
    expect(suggestBusinesses("كافه وك", 6, [wok])[0]?.name).toBe(wok.name);
    expect(runSearch(parseSearchParams({ q: "توحيد" }, [wok]), [wok]).total).toBe(1);
    expect(runSearch(parseSearchParams({ q: "Tohid" }, [wok]), [wok]).total).toBe(1);
  });
  it("recognizes the catalog category and excludes unverified/unreviewed candidates from filters", () => {
    expect(parseSearchParams({ category: "کافه" }, [wok]).categories).toEqual(["کافه"]);
    for (const filter of [{ verified: "1" }, { reviewed: "1" }, { rating: "4" }, { type: "insta" }]) {
      expect(runSearch(parseSearchParams(filter, [wok]), [wok]).total).toBe(0);
    }
  });
  it("paginates all 22 candidates without mixing sample businesses", () => {
    const cafes = Array.from({ length: 22 }, (_, i) => ({ ...wok, slug: `place-${i}` }));
    const result = runSearch(parseSearchParams({ page: "3" }, cafes), cafes);
    expect(result.total).toBe(22);
    expect(result.totalPages).toBe(3);
    expect(result.hits).toHaveLength(6);
    expect(result.counts.insta).toBe(0);
  });
});
