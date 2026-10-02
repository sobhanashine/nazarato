import { normalizeGolsarText } from "@/lib/preview/golsar";
import type { Business } from "@/lib/data/businesses";

export const AREA_COOKIE = "nazarato-area-v1";
export const AREAS = [
  { id: "rasht", label: "رشت" },
  { id: "golsar", label: "گلسار و اطراف" },
  { id: "imam-ali", label: "خیابان امام علی" },
  { id: "tohid", label: "بلوار توحید" },
  { id: "all", label: "همهٔ محدوده‌ها" },
] as const;
export type SearchArea = typeof AREAS[number]["id"];
export const DEFAULT_AREA: SearchArea = "rasht";

export function parseArea(value: unknown): SearchArea | null {
  return typeof value === "string" && AREAS.some(area => area.id === value)
    ? value as SearchArea : null;
}

/** An explicit URL, even an invalid one, takes precedence over a preference. */
export function resolveArea(explicit: unknown, remembered?: unknown): SearchArea {
  return explicit !== undefined ? parseArea(explicit) ?? DEFAULT_AREA : parseArea(remembered) ?? DEFAULT_AREA;
}

export function areaLabel(area: SearchArea): string {
  return AREAS.find(item => item.id === area)?.label ?? "رشت";
}

export function businessInArea(business: Business, area: SearchArea): boolean {
  if (area === "all") return true;
  const city = normalizeGolsarText(business.city).replace(/\brasht\b/g, "رشت");
  if (city !== "رشت") return false;
  if (area === "rasht") return true;
  const address = normalizeGolsarText(business.searchText ?? "");
  if (area === "imam-ali") return address.includes("امام علی");
  if (area === "tohid") return address.includes("توحید");
  return ["گلسار", "امام علی", "توحید"].some(street => address.includes(street));
}
