import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { GLASS } from "@/components/ui/styles";

export default function AdminOsmReviewLoading() {
  return (
    <>
      <Header />
      <Container>
        <main className="min-h-[70vh] space-y-6 py-8" aria-busy="true">
          <div className="h-24 max-w-2xl animate-pulse rounded-3xl bg-white/[0.05]" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className={`${GLASS} h-28 animate-pulse`} />
            ))}
          </div>
          <div className={`${GLASS} h-24 animate-pulse`} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className={`${GLASS} h-52 animate-pulse`} />
            ))}
          </div>
          <span className="sr-only">در حال دریافت صف بررسی داده‌ها…</span>
        </main>
      </Container>
      <Footer />
    </>
  );
}
