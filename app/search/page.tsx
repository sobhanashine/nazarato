import type { Metadata } from "next";
import Link from "next/link";
import { getDiscoveryCatalog } from "@/lib/data/discovery";
import { getPreferredArea } from "@/lib/local-area-server";
import { businessInArea, areaLabel } from "@/lib/local-area";
import { LocalDiscovery } from "@/components/search/LocalDiscovery";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CloseIcon, FilterIcon } from "@/components/icons";
import { SearchBox } from "@/components/search/SearchBox";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchPagination } from "@/components/search/SearchPagination";
import { SortSelect } from "@/components/search/SortSelect";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { Container } from "@/components/ui/Container";
import { IgShopCard } from "@/components/ui/IgShopCard";
import { BTN_PRIMARY } from "@/components/ui/styles";
import { parseSearchParams, runSearch, searchCategories, searchHref } from "@/lib/search";

type RawParams = Record<string, string | string[] | undefined>;
export async function generateMetadata({ searchParams }: { searchParams: Promise<RawParams> }): Promise<Metadata> {
  const { q } = parseSearchParams(await searchParams);
  return { title: q ? `جستجو: ${q} — نظراتو` : "کافه و رستوران پیدا کن — نظراتو", description: "جستجوی مکان‌های محلی با نام، نشانی و محدوده در رشت.", robots: { index: false } };
}
const fa = (n: number) => n.toLocaleString("fa-IR");

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const { businesses, shops, status, local } = await getDiscoveryCatalog();
  const raw = await searchParams;
  const area = await getPreferredArea(raw.area);
  const query = parseSearchParams({ ...raw, area }, businesses);
  const result = runSearch(query, businesses, shops);
  const localBusinesses = businesses.filter(b => businessInArea(b, query.area));
  const categories = searchCategories(localBusinesses);
  const hasReviewEvidence = localBusinesses.some(b => (b.reviewCount ?? 0) > 0);
  const hasVerified = localBusinesses.some(b => b.verified);
  const chips = query.categories.map(c => ({ label: c, href: searchHref(query, { categories: query.categories.filter(x => x !== c) }) }));
  if (query.minRating > 0) chips.push({ label: `${fa(query.minRating)} به بالا`, href: searchHref(query, { minRating: 0 }) });
  if (query.reviewedOnly) chips.push({ label: "دارای تجربه", href: searchHref(query, { reviewedOnly: false }) });
  if (query.verifiedOnly) chips.push({ label: "تأیید شده", href: searchHref(query, { verifiedOnly: false }) });
  const clearHref = searchHref(query, { q: "", type: "biz", categories: [], minRating: 0, reviewedOnly: false, verifiedOnly: false });
  const catalogEmpty = businesses.length === 0 && shops.length === 0;

  return (
    <>
      <Header />
      <Container>
        <main className="pb-14 pt-6 sm:pt-9">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-sm font-medium text-forest">کشف محلی · {areaLabel(query.area)}</p>
              <h1 className="text-[27px] font-extrabold leading-[1.5] text-strong sm:text-[36px]">کجا بریم؟</h1>
            </div>
            {local && <span className="rounded-lg border border-glass-border px-3 py-2 text-xs leading-5 text-muted">پیش‌نمایش خصوصی</span>}
          </div>
          <SearchBox key={query.q} query={query} businesses={localBusinesses} />
          <LocalDiscovery key={query.area} query={query} categories={categories} />
          {query.type === "insta" && <p className="mb-4 text-sm text-muted">نتایج فروشگاه‌های اینستاگرامی · <Link className="inline-flex min-h-11 items-center font-bold text-forest" href={searchHref(query, { type: "biz" })}>بازگشت به مکان‌های محلی</Link></p>}
          {chips.length > 0 && <div className="mb-5 flex flex-wrap gap-2" aria-label="انتخاب‌های فعلی">
            {chips.map(chip => <Link key={chip.label} href={chip.href} scroll={false} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-mint/25 bg-mint/5 px-3 text-sm text-forest">{chip.label}<CloseIcon className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">حذف فیلتر</span></Link>)}
            <Link className="inline-flex min-h-11 items-center px-2 text-sm text-muted underline underline-offset-4" href={clearHref}>پاک کردن انتخاب‌ها</Link>
          </div>}
          {(hasReviewEvidence || hasVerified) && <details className="mb-5 rounded-xl border border-glass-border bg-paper">
            <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 text-sm font-semibold"><FilterIcon className="h-4 w-4" />فیلتر تجربه‌ها</summary>
            <div className="border-t border-glass-border p-4"><SearchFilters query={query} categories={[]} hasReviewEvidence={hasReviewEvidence} hasVerified={hasVerified} /></div>
          </details>}
          {result.hits.length > 0 ? <section aria-label="نتایج جستجو">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted" aria-live="polite"><span className="font-bold tabular-nums text-strong">{fa(result.total)}</span> مکان{query.q ? ` برای «${query.q}»` : ""}</p>
              <SortSelect query={query} />
            </div>
            <ul className="grid gap-3 lg:grid-cols-2">
              {result.hits.map(hit => <li key={hit.kind === "company" ? hit.business.slug : hit.shop.handle}>{hit.kind === "company" ? <BusinessCard business={hit.business} /> : <IgShopCard shop={hit.shop} />}</li>)}
            </ul>
            {result.totalPages > 1 && <SearchPagination query={query} page={result.page} totalPages={result.totalPages} />}
          </section> : <section className="rounded-xl border border-glass-border bg-paper px-5 py-7 sm:p-9" aria-live="polite">
            <p className="text-lg font-bold text-strong">{status === "unavailable" ? "فهرست در دسترس نیست" : catalogEmpty ? "فهرست عمومی هنوز آماده نیست" : "برای این انتخاب، مکانی پیدا نشد"}</p>
            <p className="mt-3 max-w-[60ch] text-base leading-8 text-muted">{status === "unavailable" ? "اطلاعات دریافت نشد. دوباره تلاش کن؛ انتخاب‌هایت حفظ شده‌اند." : catalogEmpty ? "مکان‌ها پس از بررسی اطلاعات به فهرست اضافه می‌شوند. اگر کافه یا رستورانی در رشت می‌شناسی، به ما معرفی کن." : `در محدودهٔ ${areaLabel(query.area)} نتیجه‌ای با این نام یا فیلتر نداریم. می‌توانی انتخاب‌ها را پاک کنی یا محدوده را تغییر بدهی.`}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {status === "unavailable" ? <a href={searchHref(query, {})} className={`${BTN_PRIMARY} px-5`}>تلاش دوباره</a> : catalogEmpty ? <Link href="/contact" className={`${BTN_PRIMARY} px-5`}>معرفی یک مکان</Link> : <><Link href={clearHref} className={`${BTN_PRIMARY} px-5`}>پاک کردن انتخاب‌ها</Link><Link href={searchHref(query, { area: "rasht", page: 1 })} className="inline-flex min-h-11 items-center rounded-xl border border-glass-border px-5 text-sm font-bold text-forest">جستجو در رشت</Link></>}
            </div>
          </section>}
        </main>
      </Container>
      <Footer />
    </>
  );
}
