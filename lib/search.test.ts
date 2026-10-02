import { describe, expect, it, vi } from "vitest";
import { parseSearchParams, runSearch, searchCategories, suggestBusinesses, searchHref } from "./search";
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


describe("public discovery without supply", () => {
  it("never serves sample businesses when no catalog was supplied", () => {
    expect(runSearch(parseSearchParams({})).total).toBe(0);
    expect(suggestBusinesses("دیجی")).toEqual([]);
    expect(searchCategories()).toEqual([]);
  });
});


describe("location and category together", () => {
  const tohid = { ...wok, searchText: "Tohid Blvd" };
  const imam = { ...wok, slug: "imam-cafe", name: "کافه دوم", searchText: "Imam Ali Blvd" };
  const outside = { ...wok, slug: "tehran-cafe", city: "تهران" };
  it("filters an area and cafe without a typed name, excluding other cities", () => {
    const supply = [tohid, imam, outside];
    const query = parseSearchParams({ category: "کافه", area: "tohid" }, supply);
    expect(query.q).toBe("");
    expect(runSearch(query, supply).hits).toEqual([{ kind: "company", business: tohid }]);
    expect(runSearch(parseSearchParams({ area: "all", category: "کافه" }, supply), supply).total).toBe(3);
  });
  it("retains area, text and category through sorting and pagination", () => {
    const query = parseSearchParams({ q: "وک", area: "tohid", category: "کافه", page: "3" }, [wok]);
    const sortUrl = new URL(searchHref(query, { sort: "newest" }), "https://nazarato.ir");
    expect(sortUrl.searchParams.get("area")).toBe("tohid");
    expect(sortUrl.searchParams.get("category")).toBe("کافه");
    expect(sortUrl.searchParams.get("q")).toBe("وک");
    expect(sortUrl.searchParams.has("page")).toBe(false);
    expect(new URL(searchHref(query, { page: 2 }), "https://nazarato.ir").searchParams.get("page")).toBe("2");
  });
  it("keeps the cafe filter with an empty public catalog", () => {
    const query = parseSearchParams({ category: "کافه", area: "golsar" }, []);
    expect(query.categories).toEqual(["کافه"]);
    expect(query.area).toBe("golsar");
    expect(runSearch(query, []).total).toBe(0);
  });
});
