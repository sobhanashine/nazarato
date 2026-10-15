import { getDiscoveryCatalog } from "@/lib/data/discovery";
import { getPreferredArea } from "@/lib/local-area-server";
import { LocalDiscovery } from "@/components/search/LocalDiscovery";
import { parseSearchParams, searchCategories } from "@/lib/search";
import { businessInArea } from "@/lib/local-area";
import { localDiscoveryCategories } from "@/lib/data/categories";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ReviewSheetAutoOpen } from "@/components/review/ReviewSheetAutoOpen";
import { Blog } from "@/components/sections/Blog";
import { Categories } from "@/components/sections/Categories";
import { ForBusinessCTA } from "@/components/sections/ForBusinessCTA";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { HowToReview } from "@/components/sections/HowToReview";
import { InstagramShops } from "@/components/sections/InstagramShops";
import { RecentReviews } from "@/components/sections/RecentReviews";
import type { Metadata } from "next";
import { HOME_DESCRIPTION, HOME_TITLE, IS_STAGING, SITE_URL } from "@/lib/site";
import Link from "next/link";
import { NabzHomeEntry } from "@/components/nabz/NabzHomeEntry";
import { BTN_PRIMARY } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/` },
  robots: { index: !IS_STAGING, follow: !IS_STAGING },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "نظراتو",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: `${SITE_URL}/`,
  },
  twitter: { card: "summary", title: HOME_TITLE, description: HOME_DESCRIPTION },
};

export default async function HomePage() {
  const { businesses, shops, local } = await getDiscoveryCatalog();
  const area = await getPreferredArea();
  const query = parseSearchParams({ area }, businesses);
  const localBusinesses = businesses.filter(b => businessInArea(b, area));
  const earlyAccess = process.env.NODE_ENV !== "development";
  return (
    <>
      <Header />
      <main id="main-content">
      <Hero area={area} businesses={localBusinesses} earlyAccess={earlyAccess}>
        <Link href="/nabz" className={`${BTN_PRIMARY} min-h-11 px-6 py-3 text-sm`}>نبض رشت؛ پنج انتخاب تا پیشنهاد</Link>
        <LocalDiscovery key={area} query={query} categories={searchCategories(localBusinesses)} home />
      </Hero>
        <NabzHomeEntry />
        {!earlyAccess && <RecentReviews cafes={businesses} />}
        <HowItWorks earlyAccess={earlyAccess} />
        <Categories items={localDiscoveryCategories(area)} />
        {!earlyAccess && !local && shops.length > 0 && <InstagramShops shops={shops} />}
        {!earlyAccess && <HowToReview businesses={businesses} />}
        {!earlyAccess && <ForBusinessCTA />}
        {!earlyAccess && <Blog />}
      </main>
      <Footer />
      <ReviewSheetAutoOpen />
    </>
  );
}
