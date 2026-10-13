import Link from "next/link";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { localDiscoveryCategories, type Category } from "@/lib/data/categories";
import { AREAS, areaLabel, type SearchArea } from "@/lib/local-area";

export function CategoryBrowser({
  items,
  local = false,
  area = "rasht",
}: {
  items?: Category[];
  local?: boolean;
  area?: SearchArea;
}) {
  const categories = items ?? localDiscoveryCategories(area);

  return (
    <div>
      <section aria-labelledby="category-area-title" className="mb-8">
        <h2 id="category-area-title" className="mb-4 text-base font-bold text-strong">کدام محدوده؟</h2>
        <nav aria-label="انتخاب محدوده" className="flex flex-wrap gap-2">
          {AREAS.map((option) => (
            <Link
              key={option.id}
              href={`/categories?area=${option.id}`}
              aria-current={option.id === area ? "page" : undefined}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint ${option.id === area ? "border-mint bg-mint text-white" : "border-glass-border bg-glass text-strong hover:border-mint"}`}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </section>
      <section aria-labelledby="category-choice-title">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="category-choice-title" className="text-lg font-bold text-strong">چه جایی می‌خواهی؟</h2>
          <span className="text-sm text-muted">{areaLabel(area)}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => <CategoryCard key={category.href} category={category} />)}
        </div>
      </section>
      {local && (
        <p className="mt-6 border-s-2 border-pomegr ps-4 text-sm leading-7 text-muted">
          این محیط، پیش‌نمایش محلی برای بررسی رابط است. داده‌های آن فهرست عمومی یا تجربه‌های منتشرشده نیستند.
        </p>
      )}
    </div>
  );
}
