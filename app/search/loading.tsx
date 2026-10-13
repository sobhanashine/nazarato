import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <>
      <Header />
      <main aria-busy="true" className="py-8 md:py-12">
        <Container>
          <h1 className="text-[28px] font-bold leading-10 text-strong">جستجوی مکان</h1>
          <p role="status" className="mt-3 text-[14px] leading-7 text-muted">در حال دریافت فهرست مکان‌ها…</p>
          <div aria-hidden className="mt-6 divide-y divide-glass-border border-y border-glass-border">
            {[0, 1, 2].map(row => <div key={row} className="flex min-h-28 flex-col justify-center gap-3 py-5">
              <div className="h-5 w-2/3 max-w-xs rounded-sm bg-line/65" />
              <div className="h-3 w-1/3 max-w-40 rounded-sm bg-line/65" />
            </div>)}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
