import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageBanner } from "@/components/ui/PageBanner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GLASS } from "@/components/ui/styles";

export default function Loading() {
  return (
    <>
      <Header />
      <Container>
        <Breadcrumb
          items={[
            { label: "خانه", href: "/" },
            { label: "نظرات کاربران" },
          ]}
        />
      </Container>

      <PageBanner
        title="نظرات کاربران"
        subtitle="در حال بارگذاری نظرات کاربران..."
      />

      <Container>
        <div className="pb-20 lg:pb-32 animate-pulse">
          {/* Filters Skeleton */}
          <div className="flex flex-col gap-6 mb-10">
            <div>
              <div className="h-4 w-32 bg-white/[0.08] rounded mb-2.5" />
              <div className="flex flex-wrap items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-20 rounded-xl bg-white/[0.04] border border-glass-border"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-glass-border/40">
              <div>
                <div className="h-4 w-20 bg-white/[0.08] rounded mb-2.5" />
                <div className="flex flex-wrap items-center gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-16 rounded-xl bg-white/[0.04] border border-glass-border"
                    />
                  ))}
                </div>
              </div>
              <div className="h-10 w-44 rounded-xl bg-white/[0.04] border border-glass-border" />
            </div>
          </div>

          {/* Results Summary Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="h-4 w-40 bg-white/[0.06] rounded" />
            <div className="h-9 w-32 bg-white/[0.04] rounded-xl border border-glass-border" />
          </div>

          {/* Grid Skeleton */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`${GLASS} h-[200px] rounded-glass bg-white/[0.02] border border-glass-border flex flex-col p-6 gap-4`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/[0.08]" />
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-24 bg-white/[0.08] rounded" />
                      <div className="h-3.5 w-16 bg-white/[0.06] rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-white/[0.08] rounded" />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3.5 w-full bg-white/[0.05] rounded" />
                  <div className="h-3.5 w-[90%] bg-white/[0.05] rounded" />
                  <div className="h-3.5 w-[40%] bg-white/[0.05] rounded" />
                </div>
                <div className="h-4 w-20 bg-white/[0.06] rounded pt-2 mt-auto border-t border-glass-border/30" />
              </div>
            ))}
          </div>
        </div>
      </Container>
      <Footer />
    </>
  );
}
