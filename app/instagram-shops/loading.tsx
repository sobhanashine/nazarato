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
            { label: "فروشگاه‌های اینستاگرامی" },
          ]}
        />
      </Container>

      <PageBanner
        title="فروشگاه‌های اینستاگرامی"
        subtitle="در حال بارگذاری فروشگاه‌ها..."
      />

      <Container>
        <div className="pb-20 lg:pb-32">
          {/* Niche Tabs Skeleton */}
          <div className="mb-8 flex flex-wrap items-center gap-2 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-24 rounded-xl bg-white/[0.04] animate-pulse border border-glass-border"
              />
            ))}
          </div>

          {/* Grid Skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`${GLASS} h-[102px] rounded-xl bg-white/[0.02] animate-pulse border border-glass-border`}
              />
            ))}
          </div>
        </div>
      </Container>
      <Footer />
    </>
  );
}
