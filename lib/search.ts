/**
 * Pure search / filter / sort logic for `/search` (issue #18).
 *
 * Framework-free and side-effect-free on purpose: the page component only
 * parses params, calls `runSearch`, and renders. Keeping the logic here means
 * it can be unit-tested directly once a test runner is wired (PROJECT.md §3).
 *
 * Data sources are the fixture lists in `lib/data/` — `businessDetails` carries
 * a real review array (so an average + count can be derived), while IG-shop
 * `score`/`reviews` are pre-formatted Persian-numeral strings that have to be
 * parsed back into numbers for filtering and sorting.
 */

import {
  businessDetails,
  featuredBusinesses,
  ratingStats,
  type Business,
} from "@/lib/data/businesses";
import {
  instagramShops,
  nicheTabs,
  type InstagramShop,
} from "@/lib/data/instagram-shops";

export type SearchType = "all" | "biz" | "insta";
export type SortKey = "relevant" | "rating" | "reviews" | "newest";

/** Normalized, validated query — the only shape the rest of the page sees. */
export type SearchQuery = {
  q: string;
  type: SearchType;
  categories: string[];
  minRating: number; // 0 = any
  reviewedOnly: boolean;
  verifiedOnly: boolean;
  sort: SortKey;
  page: number;
};

/** One result row — discriminated so the page picks the right card. */
export type SearchHit =
  | { kind: "company"; business: Business }
  | { kind: "shop"; shop: InstagramShop };

export type SearchResult = {
  hits: SearchHit[]; // current page only
  total: number; // matches across all pages (after the type filter)
  page: number; // clamped to [1, totalPages]
  totalPages: number;
  counts: { all: number; biz: number; insta: number }; // per-tab, ignoring type
};

export const PAGE_SIZE = 8;

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "relevant", label: "مرتبط‌ترین" },
  { id: "rating", label: "بیشترین امتیاز" },
  { id: "reviews", label: "بیشترین نظر" },
  { id: "newest", label: "جدیدترین" },
];

export const RATING_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "همه امتیازها" },
  { value: 4, label: "۴ به بالا" },
  { value: 3, label: "۳ به بالا" },
  { value: 2, label: "۲ به بالا" },
];

export const TYPE_TABS: { id: SearchType; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "biz", label: "کسب‌وکارها" },
  { id: "insta", label: "اینستاگرامی" },
];

/** Distinct business categories, for the sidebar filter. */
export function searchCategories(): string[] {
  return [...new Set(businessDetails.map((b) => b.category))].sort((a, b) =>
    a.localeCompare(b, "fa"),
  );
}

/** Rank a name against a query: exact (0) → prefix (1) → contains (2) → none (3). */
function rankName(name: string, q: string): number {
  const n = name.toLowerCase();
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;
  return 3;
}

/** A normalized typeahead row — a business, whether a company or an IG shop. */
export type SearchSuggestion = {
  href: string;
  name: string;
  meta: string; // "category · city" for a company, the handle for an IG shop
  initial: string;
  color: string;
  score: string; // Persian-formatted average, or "—" when there are no reviews
};

/**
 * Live typeahead suggestions for the search box. Covers every business —
 * companies and Instagram shops alike — ranked by name match then rating.
 * Returns nothing below 2 characters. Each row links to its own profile
 * (`/company/[slug]`; IG shops use their `href`, which becomes `/shop/[handle]`
 * once that route is built — #22).
 */
export function suggestBusinesses(query: string, limit = 6): SearchSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  type Candidate = { rank: number; score: number; row: SearchSuggestion };
  const candidates: Candidate[] = [];

  businessDetails.forEach((d, i) => {
    if (!`${d.name} ${d.category} ${d.city}`.toLowerCase().includes(q)) return;
    candidates.push({
      rank: rankName(d.name, q),
      score: ratingStats(d.reviews).average,
      row: {
        href: `/company/${d.slug}`,
        name: d.name,
        meta: `${d.category} · ${d.city}`,
        initial: d.initial,
        color: d.color,
        score: featuredBusinesses[i].score,
      },
    });
  });

  instagramShops.forEach((s) => {
    const hay = `${s.name} ${s.handle} ${nicheLabel(s.niche)}`.toLowerCase();
    if (!hay.includes(q)) return;
    candidates.push({
      rank: rankName(s.name, q),
      score: faToNum(s.score),
      row: {
        href: s.href,
        name: s.name,
        meta: s.handle,
        initial: s.initial,
        color: s.color,
        score: s.score,
      },
    });
  });

  return candidates
    .sort((a, b) => a.rank - b.rank || b.score - a.score)
    .slice(0, limit)
    .map((c) => c.row);
}

/** Parse a Persian-numeral string (e.g. `"۴.۸"`, `"۳۲۵"`) into a number. */
function faToNum(input: string): number {
  const ascii = input.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
  const n = Number.parseFloat(ascii.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const nicheLabel = (id: string) =>
  nicheTabs.find((t) => t.id === id)?.label ?? id;

/** A search row enriched with the numeric fields filtering/sorting needs. */
type Enriched = SearchHit & {
  scoreNum: number;
  reviewCount: number;
  order: number; // index in source list — recency proxy (lower = newer)
  verified: boolean;
  haystack: string; // lowercased searchable text
  category: string | null; // business category; null for IG shops
};

/**
 * Built once at module load. `featuredBusinesses` is `businessDetails` mapped
 * to card shape in the same order, so index `i` lines them up.
 */
const ENRICHED: Enriched[] = [
  ...businessDetails.map((d, i): Enriched => {
    const { average, count } = ratingStats(d.reviews);
    return {
      kind: "company",
      business: featuredBusinesses[i],
      scoreNum: average,
      reviewCount: count,
      order: i,
      verified: Boolean(d.verified),
      haystack: `${d.name} ${d.category} ${d.city}`.toLowerCase(),
      category: d.category,
    };
  }),
  ...instagramShops.map((s, i): Enriched => ({
    kind: "shop",
    shop: s,
    scoreNum: faToNum(s.score),
    reviewCount: faToNum(s.reviews),
    order: i,
    verified: true, // IG-shop cards always render the verified badge
    haystack: `${s.name} ${s.handle} ${nicheLabel(s.niche)}`.toLowerCase(),
    category: null,
  })),
];

/** Does a row pass every filter? `ignoreType` skips the همه/کسب‌وکار/اینستا cut. */
function passes(e: Enriched, query: SearchQuery, ignoreType: boolean): boolean {
  if (query.q && !e.haystack.includes(query.q.toLowerCase())) return false;

  if (!ignoreType) {
    if (query.type === "biz" && e.kind !== "company") return false;
    if (query.type === "insta" && e.kind !== "shop") return false;
  }

  if (query.minRating > 0 && e.scoreNum < query.minRating) return false;
  if (query.reviewedOnly && e.reviewCount === 0) return false;
  if (query.verifiedOnly && !e.verified) return false;

  // Category is a business-only concept — selecting one excludes IG shops.
  if (query.categories.length > 0) {
    if (e.kind !== "company") return false;
    if (e.category === null || !query.categories.includes(e.category)) return false;
  }

  return true;
}

/** Higher = more relevant. With no query, falls back to rating. */
function relevance(e: Enriched, q: string): number {
  if (!q) return e.scoreNum;
  const name = (e.kind === "company" ? e.business.name : e.shop.name).toLowerCase();
  const ql = q.toLowerCase();
  if (name === ql) return 100;
  if (name.startsWith(ql)) return 80;
  if (name.includes(ql)) return 60;
  return 40; // matched on category / city / handle only
}

function comparator(sort: SortKey, q: string) {
  return (a: Enriched, b: Enriched): number => {
    switch (sort) {
      case "rating":
        return b.scoreNum - a.scoreNum || b.reviewCount - a.reviewCount;
      case "reviews":
        return b.reviewCount - a.reviewCount || b.scoreNum - a.scoreNum;
      case "newest":
        return a.order - b.order;
      case "relevant":
      default:
        return (
          relevance(b, q) - relevance(a, q) ||
          b.scoreNum - a.scoreNum ||
          b.reviewCount - a.reviewCount
        );
    }
  };
}

/** Run the full pipeline: filter → count → sort → paginate. */
export function runSearch(query: SearchQuery): SearchResult {
  // Per-tab counts ignore the type filter so each tab shows its own total.
  const matched = ENRICHED.filter((e) => passes(e, query, true));
  const counts = {
    all: matched.length,
    biz: matched.filter((e) => e.kind === "company").length,
    insta: matched.filter((e) => e.kind === "shop").length,
  };

  const filtered = matched
    .filter((e) => {
      if (query.type === "biz") return e.kind === "company";
      if (query.type === "insta") return e.kind === "shop";
      return true;
    })
    .sort(comparator(query.sort, query.q));

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * PAGE_SIZE;

  const hits: SearchHit[] = filtered
    .slice(start, start + PAGE_SIZE)
    .map((e) =>
      e.kind === "company"
        ? { kind: "company", business: e.business }
        : { kind: "shop", shop: e.shop },
    );

  return { hits, total, page, totalPages, counts };
}

type RawParams = Record<string, string | string[] | undefined>;

const firstString = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? v[0] : v) ?? "";

const asArray = (v: string | string[] | undefined): string[] =>
  Array.isArray(v) ? v : typeof v === "string" ? [v] : [];

const isOn = (v: string | string[] | undefined): boolean => {
  const s = firstString(v);
  return s === "1" || s === "true";
};

/** Turn raw `searchParams` into a validated `SearchQuery`. Never throws. */
export function parseSearchParams(raw: RawParams): SearchQuery {
  const typeRaw = firstString(raw.type);
  const type: SearchType =
    typeRaw === "biz" || typeRaw === "insta" ? typeRaw : "all";

  const sortRaw = firstString(raw.sort);
  const sort: SortKey = SORT_OPTIONS.some((o) => o.id === sortRaw)
    ? (sortRaw as SortKey)
    : "relevant";

  const ratingNum = Number.parseInt(firstString(raw.rating), 10);
  const minRating = RATING_OPTIONS.some((o) => o.value === ratingNum)
    ? ratingNum
    : 0;

  const pageNum = Number.parseInt(firstString(raw.page), 10);
  const page = Number.isFinite(pageNum) && pageNum > 1 ? pageNum : 1;

  // IG shops have no business category — drop categories when on that tab.
  const validCategories = new Set(businessDetails.map((b) => b.category));
  const categories =
    type === "insta"
      ? []
      : [...new Set(asArray(raw.category))].filter((c) => validCategories.has(c));

  return {
    q: firstString(raw.q).trim().slice(0, 100),
    type,
    categories,
    minRating,
    reviewedOnly: isOn(raw.reviewed),
    verifiedOnly: isOn(raw.verified),
    sort,
    page,
  };
}

/**
 * Build a `/search` URL from the current query plus a patch. Page resets to 1
 * unless the patch sets it explicitly; switching to the IG tab drops
 * categories (they don't apply to shops).
 */
export function searchHref(
  current: SearchQuery,
  patch: Partial<SearchQuery>,
): string {
  const next: SearchQuery = { ...current, ...patch };
  if (!("page" in patch)) next.page = 1;
  if (next.type === "insta") next.categories = [];

  const sp = new URLSearchParams();
  if (next.q) sp.set("q", next.q);
  if (next.type !== "all") sp.set("type", next.type);
  for (const c of next.categories) sp.append("category", c);
  if (next.minRating > 0) sp.set("rating", String(next.minRating));
  if (next.reviewedOnly) sp.set("reviewed", "1");
  if (next.verifiedOnly) sp.set("verified", "1");
  if (next.sort !== "relevant") sp.set("sort", next.sort);
  if (next.page > 1) sp.set("page", String(next.page));

  const qs = sp.toString();
  return qs ? `/search?${qs}` : "/search";
}

/** Add or remove a category from the current selection. */
export function toggleCategory(categories: string[], category: string): string[] {
  return categories.includes(category)
    ? categories.filter((c) => c !== category)
    : [...categories, category];
}
