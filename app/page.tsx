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

export default async function HomePage() {
  const cafes = await getLocalGolsarCafes();
  const businesses = cafes?.map(toGolsarBusiness);
  return (
    <>
      <Header />
      <Hero businesses={businesses} />
      <main>
        <RecentReviews cafes={businesses} />
        <HowItWorks />
        <Categories items={cafes ? golsarCategories() : undefined} local={cafes !== null} />
        {cafes === null && <InstagramShops />}
        <HowToReview businesses={businesses} />
        <ForBusinessCTA />
        <Blog />
      </main>
      <Footer />
      <ReviewSheetAutoOpen />
    </>
  );
}
