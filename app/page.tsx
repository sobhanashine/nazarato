import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BestCompanies } from "@/components/sections/BestCompanies";
import { Blog } from "@/components/sections/Blog";
import { Categories } from "@/components/sections/Categories";
import { Hero } from "@/components/sections/Hero";
import { InstagramShops } from "@/components/sections/InstagramShops";

export default function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <main>
        <Categories />
        <BestCompanies />
        <InstagramShops />
        <Blog />
      </main>
      <Footer />
    </>
  );
}
