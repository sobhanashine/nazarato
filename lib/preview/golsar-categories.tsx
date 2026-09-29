import { LocationIcon } from "@/components/icons";
import type { Category } from "@/lib/data/categories";

export function golsarCategories(): Category[] {
  return ["", "توحید", "امام علی", "گلسار"].map(area => ({
    title: area ? (area === "گلسار" ? "گلسار و اطراف" : `خیابان ${area}`) : "همهٔ کافه‌ها",
    href: area ? `/search?q=${encodeURIComponent(area)}` : "/search",
    desc: area ? `کافه‌هایی با نشانی ثبت‌شده در محدودهٔ ${area}` : "کافه‌های فهرست اولیهٔ گلسار و اطراف",
    icon: <LocationIcon className="h-8 w-8 text-mint" />,
  }));
}
