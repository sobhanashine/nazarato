import type { Metadata } from "next";
import { CategoryBrowser } from "@/components/categories/CategoryBrowser";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { localDiscoveryCategories } from "@/lib/data/categories";
import { getPreferredArea } from "@/lib/local-area-server";
import { getLocalGolsarCafes } from "@/lib/preview/golsar-server";

export const metadata: Metadata = {
  title: "کافه و رستوران در رشت – نظراتو",
  description: "محدوده‌ات را انتخاب کن و کافه‌ها و رستوران‌ها را با اطلاعات منبع‌دار بررسی کن.",
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string | string[] }>;
}) {
  const params = await searchParams;
  const area = await getPreferredArea(params.area);
  const cafes = await getLocalGolsarCafes();

  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "کافه و رستوران" }]} />
        <main className="pb-20 pt-6 sm:pt-10 lg:pb-28">
          <div className="mb-9 max-w-2xl sm:mb-12">
            <p className="mb-3 text-sm font-semibold text-mint">انتخاب محلی در رشت</p>
            <h1 className="text-[2.1rem] font-bold leading-[1.45] text-strong sm:text-5xl">
              کافه یا رستوران؟
            </h1>
            <p className="mt-5 text-base leading-8 text-muted sm:text-lg">
              از محدوده‌ای که به کارت می‌آید شروع کن. اطلاعات هر جا را ببین و بعد تصمیم بگیر.
            </p>
          </div>
          <CategoryBrowser items={localDiscoveryCategories(area)} area={area} local={cafes !== null} />
          <p className="mt-8 max-w-2xl text-sm leading-7 text-muted">
            فهرست عمومی به‌مرور با اطلاعات بررسی‌شده تکمیل می‌شود. نبودن یک جا در نتایج، به معنی بسته‌بودن یا کیفیت آن نیست.
          </p>
        </main>
      </Container>
      <Footer />
    </>
  );
}
