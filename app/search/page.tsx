import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  ChevronLeftIcon,
  CloseIcon,
  FilterIcon,
  SearchIcon,
} from "@/components/icons";
import { SearchBox } from "@/components/search/SearchBox";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchPagination } from "@/components/search/SearchPagination";
import { SortSelect } from "@/components/search/SortSelect";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { Container } from "@/components/ui/Container";
import { IgShopCard } from "@/components/ui/IgShopCard";
import { PageBanner } from "@/components/ui/PageBanner";
import { GLASS } from "@/components/ui/styles";
import { featuredBusinesses } from "@/lib/data/businesses";
import {
  TYPE_TABS,
  parseSearchParams,
  runSearch,
  searchCategories,
  searchHref,
} from "@/lib/search";

type RawParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}): Promise<Metadata> {
  const { q } = parseSearchParams(await searchParams);
  return {
    title: q ? `جستجو: ${q} — نظراتو` : "جستجو — نظراتو",
    description: "جستجوی کسب‌وکارها و فروشگاه‌های اینستاگرامی ایرانی در نظراتو.",
    robots: { index: false },
  };
}

const fa = (n: number) => n.toLocaleString("fa-IR");

const tabBase =
  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[13.5px] font-semibold transition-colors duration-200";
const tabIdle =
  "border-glass-border bg-glass text-muted hover:border-mint/40 hover:text-strong";
const tabActive =
  "border-transparent text-[#06231b] bg-[linear-gradient(135deg,#5BE6B2_0%,#3FBF92_100%)] shadow-[0_6px_18px_-8px_rgba(91,230,178,0.6)]";
const tabCount = (active: boolean) =>
  `inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
    active ? "bg-[#06231b]/20 text-[#06231b]" : "bg-glass-strong text-muted"
  }`;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const query = parseSearchParams(await searchParams);
  const result = runSearch(query);
  const categories = searchCategories();
  const hasQuery = query.q.length > 0;

  // Dismissible chips for every active filter.
  const chips: { label: string; href: string }[] = [];
  for (const c of query.categories) {
    chips.push({
      label: c,
      href: searchHref(query, {
        categories: query.categories.filter((x) => x !== c),
      }),
    });
  }
  if (query.minRating > 0) {
    chips.push({
      label: `${fa(query.minRating)} به بالا`,
      href: searchHref(query, { minRating: 0 }),
    });
  }
  if (query.reviewedOnly) {
    chips.push({
      label: "دارای نظر",
      href: searchHref(query, { reviewedOnly: false }),
    });
  }
  if (query.verifiedOnly) {
    chips.push({
      label: "تأیید شده",
      href: searchHref(query, { verifiedOnly: false }),
    });
  }

  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "جستجو" }]} />
      </Container>
      <PageBanner
        title={hasQuery ? `نتایج جستجو برای «${query.q}»` : "جستجوی کسب‌وکارها"}
        subtitle={
          hasQuery
            ? undefined
            : "نام کسب‌وکار، فروشگاه اینستاگرامی یا دسته‌بندی موردنظرت را وارد کن."
        }
      />

      <Container>
        <main className="pb-20 lg:pb-32">
          {/* Search box with live company typeahead — first focusable in <main>. */}
          <SearchBox query={query} />

          {/* Type tabs. */}
          <nav
            className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="نوع نتیجه"
          >
            {TYPE_TABS.map((t) => {
              const active = query.type === t.id;
              return (
                <Link
                  key={t.id}
                  href={searchHref(query, { type: t.id })}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={`${tabBase} ${active ? tabActive : tabIdle}`}
                >
                  {t.label}
                  <span className={tabCount(active)}>
                    {fa(result.counts[t.id])}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Filters — collapsible accordion on mobile. */}
            <details className="group rounded-2xl border border-glass-border bg-glass lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-strong">
                  <FilterIcon className="h-4 w-4 text-mint" />
                  فیلترها
                  {chips.length > 0 && (
                    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-mint/15 px-1.5 text-[11px] font-bold tabular-nums text-mint">
                      {fa(chips.length)}
                    </span>
                  )}
                </span>
                <ChevronLeftIcon className="h-3.5 w-3.5 -rotate-90 text-muted transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <div className="border-t border-glass-border px-4 pb-4 pt-4">
                <SearchFilters query={query} categories={categories} />
              </div>
            </details>

            {/* Filters — sticky sidebar on desktop. */}
            <aside className="hidden lg:block">
              <div className={`${GLASS} sticky top-24 p-5`}>
                <SearchFilters query={query} categories={categories} />
              </div>
            </aside>

            {/* Results column. */}
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[14px] text-muted" aria-live="polite">
                  <span className="font-bold text-strong tabular-nums">
                    {fa(result.total)}
                  </span>{" "}
                  نتیجه
                </p>
                <SortSelect query={query} />
              </div>

              {/* Active filter chips. */}
              {chips.length > 0 && (
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  {chips.map((chip) => (
                    <Link
                      key={chip.label}
                      href={chip.href}
                      scroll={false}
                      className="inline-flex items-center gap-1.5 rounded-full border border-mint/35 bg-mint/10 py-1 ps-3 pe-2 text-[12.5px] font-medium text-mint transition-colors hover:bg-mint/20"
                    >
                      {chip.label}
                      <CloseIcon
                        aria-hidden
                        className="h-3 w-3"
                      />
                      <span className="sr-only">حذف فیلتر</span>
                    </Link>
                  ))}
                  <Link
                    href={searchHref(query, {
                      categories: [],
                      minRating: 0,
                      reviewedOnly: false,
                      verifiedOnly: false,
                    })}
                    scroll={false}
                    className="text-[12.5px] font-medium text-muted underline underline-offset-4 transition-colors hover:text-strong"
                  >
                    حذف همه فیلترها
                  </Link>
                </div>
              )}

              {result.hits.length > 0 ? (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {result.hits.map((hit) => (
                    <li
                      key={
                        hit.kind === "company"
                          ? `c-${hit.business.slug}`
                          : `s-${hit.shop.handle}`
                      }
                    >
                      {hit.kind === "company" ? (
                        <BusinessCard business={hit.business} />
                      ) : (
                        <IgShopCard shop={hit.shop} />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  className={`${GLASS} flex flex-col items-center px-6 py-12 text-center`}
                >
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-glass-border bg-glass text-muted [&_svg]:h-5 [&_svg]:w-5">
                    <SearchIcon />
                  </span>
                  <p className="mb-1.5 text-[16px] font-bold text-strong">
                    چیزی پیدا نشد
                  </p>
                  <p className="mb-7 max-w-[42ch] text-[13px] leading-[1.8] text-muted">
                    جستجو یا فیلترها را تغییر بده — یا یکی از این کسب‌وکارهای
                    پرطرفدار را ببین.
                  </p>
                  <ul className="grid w-full gap-4 text-start sm:grid-cols-2">
                    {featuredBusinesses.slice(0, 4).map((b) => (
                      <li key={b.slug}>
                        <BusinessCard business={b} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.totalPages > 1 && (
                <SearchPagination
                  query={query}
                  page={result.page}
                  totalPages={result.totalPages}
                />
              )}
            </section>
          </div>
        </main>
      </Container>
      <Footer />
    </>
  );
}
