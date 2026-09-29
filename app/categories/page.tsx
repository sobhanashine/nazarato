import { getLocalGolsarCafes } from "@/lib/preview/golsar-server";
import { golsarCategories } from "@/lib/preview/golsar-categories";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { CategoryBrowser } from "@/components/categories/CategoryBrowser";
import { PageBanner } from "@/components/ui/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "دسته‌بندی‌ها – نظراتو",
  description: "همه دسته‌بندی‌های کسب‌وکارها و برندهای ایرانی در نظراتو",
};

export default async function CategoriesPage() {
  const cafes = await getLocalGolsarCafes();
  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "دسته‌بندی‌ها" }]} />
      </Container>
      <PageBanner
        title="دسته‌بندی‌ها"
        subtitle="از میان دسته‌بندی‌های مختلف، کسب‌وکارها و برندهای ایرانی موردنظرت را پیدا کن."
      />

      <Container>
        <main className="pb-20 lg:pb-32">
          <CategoryBrowser items={cafes !== null ? golsarCategories() : undefined} local={cafes !== null} />
        </main>
      </Container>
      <Footer />
    </>
  );
}

