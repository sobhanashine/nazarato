import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getCategoryTitle, type Business } from "./businesses";
import type { InstagramShop, Niche } from "./instagram-shops";
import { getLocalGolsarCafes } from "@/lib/preview/golsar-server";
import { toGolsarBusiness } from "@/lib/preview/golsar-product";

function text(value: unknown, length = 200): string {
  return typeof value === "string" ? value.trim().slice(0, length) : "";
}
function finite(value: unknown, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : 0;
}
export function mapDiscoveryRow(value: unknown): { business: Business } | { shop: InstagramShop } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const slug = typeof row.slug === "string" ? row.slug.trim() : "", name = text(row.name), category = text(row.category_slug, 100);
  if (!/^[\p{L}\p{N}_-]{1,160}$/u.test(slug) || !name || !category || !["company", "ig_shop"].includes(String(row.type))) return null;
  const reviewCount = Math.floor(finite(row.review_count, 1_000_000_000));
  const rating = finite(row.rating_avg, 5);
  const base = { slug, name, initial: text(row.initial, 2) || name.charAt(0), color: /^#[0-9a-f]{6}$/i.test(String(row.color)) ? String(row.color) : "#7B89FF", score: reviewCount ? rating.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—", reviews: reviewCount.toLocaleString("fa-IR"), verified: row.verified === true };
  if (row.type === "ig_shop") {
    if (!["clothing", "food", "beauty", "decor", "digital"].includes(category)) return null;
    return { shop: { ...base, href: `/shop/${slug}`, niche: category as Exclude<Niche, "all">, handle: `@${slug}` } };
  }
  const info = Array.isArray(row.info) ? row.info.flatMap((v: unknown) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return [];
    const entry = v as Record<string, unknown>;
    return ["نشانی", "آدرس", "محله", "محدوده"].includes(text(entry.label)) ? [text(entry.value, 500)] : [];
  }).join(" ") : "";
  const cafe = category === "cafe" || category === "cafes" || /کافه|coffee|cafe/i.test(name);
  return { business: { ...base, city: text(row.city, 160) || "نامشخص", category: cafe ? "کافه" : getCategoryTitle(category), reviewCount, searchText: info } };
}

/** Fail closed; only a deliberate approved-source record can supply the public UI. */
export const getDiscoveryCatalog = cache(async () => {
  const cafes = await getLocalGolsarCafes();
  if (cafes !== null) return { businesses: cafes.map(toGolsarBusiness), shops: [] as InstagramShop[], local: true };
  try {
    const { data, error } = await supabaseAdmin().from("businesses")
      .select("slug,type,name,category_slug,city,initial,color,verified,review_count,rating_avg,info,business_sources!inner(status)")
      .in("status", ["active", "merged"]).eq("business_sources.status", "approved")
      .order("created_at", { ascending: false }).limit(250);
    if (error || !Array.isArray(data)) throw new Error(error?.code ?? "invalid catalog response");
    const businesses: Business[] = [], shops: InstagramShop[] = [];
    for (const row of data) {
      const mapped = mapDiscoveryRow(row);
      if (mapped && "business" in mapped) businesses.push(mapped.business);
      if (mapped && "shop" in mapped) shops.push(mapped.shop);
    }
    return { businesses, shops, local: false };
  } catch (error) {
    console.error("[discovery] public catalog unavailable", { route: "discovery", error: error instanceof Error ? error.message : "unknown" });
    return { businesses: [] as Business[], shops: [] as InstagramShop[], local: false };
  }
});
