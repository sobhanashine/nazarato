import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Blog } from "@/components/sections/Blog";
import { Categories } from "@/components/sections/Categories";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { InstagramShops } from "@/components/sections/InstagramShops";
import { RecentReviews } from "@/components/sections/RecentReviews";

export default function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <main>
        <HowItWorks />
        <Categories />
        <RecentReviews />
        <InstagramShops />
        <Blog />
      </main>
      <Footer />
    </>
  );
}
