import { describe, expect, it } from "vitest";
import { categoryHref } from "./category-url";

describe("category links shared by server and client", () => {
  it("omits the default sort, subcategory and first page", () => {
    expect(categoryHref("food", {})).toBe("/categories/food");
    expect(categoryHref("food", { sort: "rating", sub: "همه", page: 1 })).toBe("/categories/food");
  });

  it("preserves the selected sort and subcategory when paginating", () => {
    const href = categoryHref("digital", { sort: "reviews", sub: "خرده‌فروشی آنلاین", page: 3 });
    const url = new URL(href, "https://nazarato.ir");
    expect(url.pathname).toBe("/categories/digital");
    expect(Object.fromEntries(url.searchParams)).toEqual({ sort: "reviews", sub: "خرده‌فروشی آنلاین", page: "3" });
  });

  it("resets pagination while preserving filters when the sort changes", () => {
    const url = new URL(categoryHref("food", { sort: "newest", sub: "کافه", page: 1 }), "https://nazarato.ir");
    expect(Object.fromEntries(url.searchParams)).toEqual({ sort: "newest", sub: "کافه" });
  });

  it("encodes subcategory text without introducing query parameters", () => {
    const sub = "کافه & رستوران / ?page=9#نام";
    const url = new URL(categoryHref("food", { sub, page: 2 }), "https://nazarato.ir");
    expect(Object.fromEntries(url.searchParams)).toEqual({ sub, page: "2" });
    expect(url.hash).toBe("");
  });
});
