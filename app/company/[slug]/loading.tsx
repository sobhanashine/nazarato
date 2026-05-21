import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";

const block = "rounded-glass border border-glass-border bg-glass";

export default function CompanyLoading() {
  return (
    <>
      <Header />
      <Container>
        <div className="animate-pulse py-8" aria-hidden>
          <div className={`${block} h-36 w-full sm:h-52`} />
          <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
            <div className={`${block} h-24 w-24 !rounded-3xl sm:h-28 sm:w-28`} />
            <div className="flex-1 space-y-2 pb-2">
              <div className={`${block} h-6 w-2/3`} />
              <div className={`${block} h-4 w-1/3`} />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <div className={`${block} h-10 w-32`} />
            <div className={`${block} h-10 w-24`} />
          </div>
          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            <div className={`${block} h-64 lg:col-span-2`} />
            <div className={`${block} h-64`} />
          </div>
        </div>
        <span className="sr-only">در حال بارگذاری…</span>
      </Container>
      <Footer />
    </>
  );
}
