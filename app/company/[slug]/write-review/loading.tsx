import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";

const block = "rounded-glass border border-glass-border bg-glass";

/**
 * Form-shaped skeleton for `/company/[slug]/write-review`. Overrides the
 * company-profile skeleton in `../loading.tsx`, which would otherwise show.
 */
export default function WriteReviewLoading() {
  return (
    <>
      <Header />
      <Container>
        <div className="my-6 h-5 w-48 animate-pulse rounded bg-glass" aria-hidden />
        <div className="flex justify-center pb-12 lg:pb-20">
          <div
            className={`${block} w-full max-w-[640px] animate-pulse space-y-6 p-6 sm:p-8`}
            aria-hidden
          >
            <div className="h-7 w-32 rounded bg-white/[0.06]" />
            <div className="h-4 w-3/4 rounded bg-white/[0.04]" />
            <div className="h-12 w-60 rounded-lg bg-white/[0.04]" />
            <div className="h-14 rounded-xl bg-white/[0.04]" />
            <div className="h-40 rounded-xl bg-white/[0.04]" />
            <div className="h-12 rounded-xl bg-white/[0.04]" />
            <div className="h-12 rounded-full bg-white/[0.06]" />
          </div>
        </div>
        <span className="sr-only">در حال بارگذاری…</span>
      </Container>
      <Footer />
    </>
  );
}
