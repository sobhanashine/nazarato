import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";

const block = "rounded-glass border border-glass-border bg-glass";

export default function SearchLoading() {
  return (
    <>
      <Header />
      <Container>
        <div className="animate-pulse py-8" aria-hidden>
          <div className={`${block} h-12 w-full rounded-2xl`} />
          <div className="mt-6 flex gap-2">
            <div className={`${block} h-9 w-20 !rounded-full`} />
            <div className={`${block} h-9 w-28 !rounded-full`} />
            <div className={`${block} h-9 w-28 !rounded-full`} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className={`${block} hidden h-72 lg:block`} />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`${block} h-[100px]`} />
              ))}
            </div>
          </div>
        </div>
        <span className="sr-only">در حال بارگذاری نتایج…</span>
      </Container>
      <Footer />
    </>
  );
}
