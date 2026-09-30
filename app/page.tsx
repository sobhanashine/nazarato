import { getLocalGolsarCafes } from "@/lib/preview/golsar-server";
import { golsarCategories } from "@/lib/preview/golsar-categories";
import { toGolsarBusiness } from "@/lib/preview/golsar-product";
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
import { HOME_DESCRIPTION, HOME_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/` },
  robots: { index: true, follow: true },
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
  const cafes = await getLocalGolsarCafes();
  const businesses = cafes?.map(toGolsarBusiness);
  const earlyAccess = process.env.NODE_ENV !== "development";
  return (
    <>
      <Header />
      <Hero businesses={earlyAccess ? [] : businesses} earlyAccess={earlyAccess} />
      <main>
        {!earlyAccess && <RecentReviews cafes={businesses} />}
        <HowItWorks earlyAccess={earlyAccess} />
        <Categories items={cafes ? golsarCategories() : undefined} local={cafes !== null} />
        {!earlyAccess && cafes === null && <InstagramShops />}
        {!earlyAccess && <HowToReview businesses={businesses} />}
        {!earlyAccess && <ForBusinessCTA />}
        {!earlyAccess && <Blog />}
      </main>
      <Footer />
      <ReviewSheetAutoOpen />
    </>
  );
}
