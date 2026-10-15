import { getLocalGolsarCafes } from "@/lib/preview/golsar-server";
import { localDiscoveryCategories } from "@/lib/data/categories";
import { getPreferredArea } from "@/lib/local-area-server";
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

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ area?: string | string[] }> }) {
  const area = await getPreferredArea((await searchParams).area);
  const cafes = await getLocalGolsarCafes();
  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "دسته‌بندی‌ها" }]} />
      </Container>
      <PageBanner
        title="دسته‌بندی‌ها"
        subtitle="از محدوده‌ات شروع کن؛ اطلاعات کافه‌ها و رستوران‌ها را برای انتخاب بعدی ببین."
      />

      <Container>
        <main className="pb-20 lg:pb-32">
          <CategoryBrowser items={localDiscoveryCategories(area)} area={area} local={cafes !== null} />
        </main>
      </Container>
      <Footer />
    </>
  );
}
