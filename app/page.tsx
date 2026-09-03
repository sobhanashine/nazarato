import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ReviewSheetAutoOpen } from "@/components/review/ReviewSheetAutoOpen";
import { Blog } from "@/components/sections/Blog";
import { Categories } from "@/components/sections/Categories";
import { ForBusinessCTA } from "@/components/sections/ForBusinessCTA";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { HowToReview } from "@/components/sections/HowToReview";
import { InstagramShops } from "@/components/sections/InstagramShops";
import { RecentReviews } from "@/components/sections/RecentReviews";
import { NabzRasht } from "@/components/nabz/NabzRasht";

export default function HomePage() {
  return (
    <>
      <Header />
      <NabzRasht />
      <main>
        <RecentReviews />
        <HowItWorks />
        <Categories />
        <InstagramShops />
        <HowToReview />
        <ForBusinessCTA />
        <Blog />
      </main>
      <Footer />
      <ReviewSheetAutoOpen />
    </>
  );
}
