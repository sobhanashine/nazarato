import Link from "next/link";
import { getDiscoveryCatalog } from "@/lib/data/discovery";
import { getPreferredArea } from "@/lib/local-area-server";
import { LocalDiscovery } from "@/components/search/LocalDiscovery";
import { parseSearchParams, searchCategories, searchHref } from "@/lib/search";
import { areaLabel, businessInArea } from "@/lib/local-area";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ReviewSheetAutoOpen } from "@/components/review/ReviewSheetAutoOpen";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { Container } from "@/components/ui/Container";
import type { Metadata } from "next";
import { HOME_DESCRIPTION, HOME_TITLE, IS_STAGING, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/` },
  robots: { index: !IS_STAGING, follow: !IS_STAGING },
  openGraph: { type: "website", locale: "fa_IR", siteName: "نظراتو", title: HOME_TITLE, description: HOME_DESCRIPTION, url: `${SITE_URL}/` },
  twitter: { card: "summary", title: HOME_TITLE, description: HOME_DESCRIPTION },
};

export default async function HomePage() {
  const catalog = await getDiscoveryCatalog();
  const { businesses, local } = catalog;
  const catalogStatus = catalog.status;
  const area = await getPreferredArea();
  const query = parseSearchParams({ area }, businesses);
  const localBusinesses = businesses.filter(business => businessInArea(business, area));
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero businesses={localBusinesses} area={area}>
          <LocalDiscovery key={area} query={query} categories={searchCategories(localBusinesses)} catalogStatus={catalogStatus} home />
        </Hero>
        <section aria-labelledby="local-places" className="py-8 md:py-12">
          <Container>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="local-places" className="text-[20px] font-bold leading-8 text-strong">مکان‌های {areaLabel(area)}</h2>
              {localBusinesses.length > 0 && <Link href={searchHref(query, { type: "biz" })} className="inline-flex min-h-11 shrink-0 items-center text-[13px] font-semibold text-forest">همهٔ مکان‌ها <span aria-hidden className="ms-2">←</span></Link>}
            </div>
            {local && <p className="mb-4 border-s-2 border-pomegr ps-3 text-[12px] leading-6 text-muted">پیش‌نمایش محلی: اطلاعات اولیه از منبع عمومی است؛ تجربهٔ مشتری یا تأیید مالک محسوب نمی‌شود.</p>}
            {localBusinesses.length > 0 ? <div className="grid gap-x-10 lg:grid-cols-2">
              {localBusinesses.slice(0, 4).map(business => <BusinessCard key={business.slug} business={business} />)}
            </div> : <div className="border-y border-glass-border py-6">
              <h3 className="text-[18px] font-semibold leading-8 text-strong">{catalogStatus === "unavailable" ? "فهرست فعلاً در دسترس نیست" : area === "rasht" ? "فهرست رشت هنوز آماده نیست" : "در این محدوده هنوز مکانی منتشر نشده"}</h3>
              <p className="mt-2 max-w-xl text-[14px] leading-7 text-muted">{catalogStatus === "unavailable" ? "دریافت اطلاعات انجام نشد. کمی بعد دوباره تلاش کن." : "مکان‌ها و تجربه‌ها پس از بررسی نمایش داده می‌شوند."}</p>
              <Link href="/contact" className="mt-3 inline-flex min-h-11 items-center text-[13px] font-semibold text-forest">پیشنهاد مکان یا اصلاح اطلاعات <span aria-hidden className="ms-2">←</span></Link>
            </div>}
          </Container>
        </section>
        <section className="border-y border-glass-border bg-paper py-8"><Container><h2 className="text-xl font-bold">پنج انتخاب؛ سپس پیشنهاد با شاهد</h2><p className="mt-2 max-w-2xl text-base leading-8 text-muted">در نبض رشت، موقعیتت را انتخاب کن. پیشنهاد فقط با تجربه‌های معتبر ساخته می‌شود؛ نبود شاهد هم روشن نمایش داده می‌شود.</p><Link href="/nabz" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-forest px-5 py-3 text-base font-semibold text-white">شروع انتخاب محلی</Link></Container></section>
        <HowItWorks />
      </main>
      <Footer />
      <ReviewSheetAutoOpen />
    </>
  );
}
