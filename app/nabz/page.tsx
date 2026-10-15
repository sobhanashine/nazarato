import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { GLASS, TAG_BADGE } from "@/components/ui/styles";
import { RealNabzJourney } from "@/components/nabz/RealNabzJourney";
import { COMPARISON_SCENARIOS } from "@/lib/nabz/vote-contract";

export const metadata: Metadata = {
  title: "نبض رشت — انتخاب با شاهد",
  robots: { index: false, follow: false },
};

export default async function NabzPage({ searchParams }: {
  searchParams: Promise<{ scenario?: string | string[] }>;
}) {
  const { scenario } = await searchParams;
  const selected = COMPARISON_SCENARIOS.find(value => value === scenario) ?? "date";
  return (
    <>
      <Header />
      <main id="main-content" className="py-8 sm:py-14">
        <Container>
          <div className="mx-auto max-w-4xl">
            <span className={TAG_BADGE}>نبض رشت · انتخاب محلی</span>
            <h1 className="mt-4 text-3xl font-extrabold leading-relaxed text-strong sm:text-4xl">نبض رشت؛ انتخاب با شاهد</h1>
            <p className="mb-7 mt-3 max-w-2xl text-base leading-8 text-muted">پنج مقایسهٔ کوتاه، سپس پیشنهاد اولیه با تجربه‌های منتشرشده. وقتی داده کافی نباشد، نتیجه‌ای ساخته نمی‌شود.</p>
            <div className={`${GLASS} p-5 sm:p-8`}>
              <RealNabzJourney initialScenario={selected} />
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
