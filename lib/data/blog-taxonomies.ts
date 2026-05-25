/**
 * Blog taxonomies (categories + tags).
 *
 * Slugs are produced by `slugifyTaxonomy()` — we keep the Persian characters
 * (good for SEO and matches how the user sees the term in the URL) and only
 * normalize whitespace into dashes. The browser URL-encodes the rest. Lookups
 * are O(N) with N <= ~20, which is fine.
 */
export const blogCategories: string[] = [
  "فناوری",
  "رستوران",
  "آموزش",
  "سلامت",
  "سفر",
  "فروشگاه آنلاین",
  "خدمات مالی",
  "راهنما",
];

export const blogTags: string[] = [
  "راهنما",
  "تحلیل",
  "کسب‌وکار",
  "دیجیتال",
  "برندها",
  "نظرات",
  "خرید",
];

/**
 * Convert a taxonomy name into a URL slug. We trim, collapse internal
 * whitespace, and replace it with a single dash. Persian characters are
 * kept verbatim — Next.js + browsers URL-encode them transparently.
 */
export function slugifyTaxonomy(name: string): string {
  return name.trim().replace(/\s+/g, "-");
}

/**
 * Reverse a slug back to its taxonomy name. Returns `null` for unknown
 * slugs so callers can `notFound()` cleanly. Matches the slugified form
 * after URL-decoding (Next.js delivers the slug already decoded).
 */
export function getCategoryBySlug(slug: string): string | null {
  const target = slug.trim();
  return blogCategories.find((c) => slugifyTaxonomy(c) === target) ?? null;
}

export function getTagBySlug(slug: string): string | null {
  const target = slug.trim();
  return blogTags.find((t) => slugifyTaxonomy(t) === target) ?? null;
}
