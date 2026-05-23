import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageBanner } from "@/components/ui/PageBanner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ReviewCard } from "@/components/ui/ReviewCard";
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from "@/components/icons";
import { GLASS } from "@/components/ui/styles";
import { getReviewsFromDb } from "@/lib/data/reviews";

type SearchParams = Promise<{ page?: string }>;

export const metadata: Metadata = {
  title: "نظرات کاربران – نظراتو",
  description:
    "آخرین نظرات، نقدها و تجربه‌های واقعی کاربران از خرید آنلاین از وب‌سایت‌ها و فروشگاه‌های اینستاگرام.",
};

function reviewsPageHref(page: number): string {
  return page > 1 ? `/reviews?page=${page}` : "/reviews";
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page: pageParam } = await searchParams;

  const parsed = pageParam ? parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const limit = 12;

  const { reviews, total } = await getReviewsFromDb({
    sort: "newest",
    page,
    limit,
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const fa = (n: number) => n.toLocaleString("fa-IR");
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const paginationStep = (
    target: number,
    label: string,
    icon: React.ReactNode,
    enabled: boolean,
  ) =>
    enabled ? (
      <Link
        href={reviewsPageHref(target)}
        aria-label={label}
        className="h-10 min-w-10 px-2 rounded-full inline-flex items-center justify-center text-[0.95rem] tabular-nums border border-glass-border bg-glass text-strong hover:border-mint/50 hover:text-mint hover:bg-glass-hover transition-colors duration-200 [&_svg]:h-3.5 [&_svg]:w-3.5"
      >
        {icon}
      </Link>
    ) : (
      <span
        aria-hidden
        className="h-10 min-w-10 px-2 rounded-full inline-flex items-center justify-center text-[0.95rem] tabular-nums border border-glass-border bg-glass text-muted opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5"
      >
        {icon}
      </span>
    );

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
        title="آخرین نظرات کاربران"
        subtitle="جدیدترین تجربه‌های واقعی خریداران از وب‌سایت‌ها و فروشگاه‌های اینستاگرامی."
      />

      <Container>
        <main className="pb-20 lg:pb-32">
          {/* Section title */}
          <h2 className="mb-8 text-[18px] sm:text-[20px] font-black text-strong">
            جدیدترین نظرات از همه‌ی کسب‌وکارها
          </h2>

          {/* Reviews grid or empty state */}
          {reviews.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  aria-label="صفحه‌بندی نتایج"
                  className="mt-12 flex items-center justify-center gap-2"
                >
                  {paginationStep(
                    page - 1,
                    "صفحه قبلی",
                    <ChevronRightIcon />,
                    page > 1,
                  )}

                  <ul className="flex items-center gap-1.5">
                    {pages.map((p) => {
                      const isActive = p === page;
                      return (
                        <li key={p}>
                          {isActive ? (
                            <span
                              aria-current="page"
                              className="h-10 min-w-10 rounded-full inline-flex items-center justify-center text-[0.95rem] tabular-nums font-bold border border-mint bg-mint/10 text-mint"
                            >
                              {fa(p)}
                            </span>
                          ) : (
                            <Link
                              href={reviewsPageHref(p)}
                              aria-label={`برو به صفحه ${fa(p)}`}
                              className="h-10 min-w-10 rounded-full inline-flex items-center justify-center text-[0.95rem] tabular-nums font-medium border border-glass-border bg-glass text-muted hover:border-glass-border-hi hover:text-strong hover:bg-glass-hover transition-colors duration-200"
                            >
                              {fa(p)}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {paginationStep(
                    page + 1,
                    "صفحه بعدی",
                    <ChevronLeftIcon />,
                    page < totalPages,
                  )}
                </nav>
              )}
            </>
          ) : (
            <div
              className={`${GLASS} flex flex-col items-center gap-4.5 p-8 text-center sm:p-12 max-w-[560px] mx-auto`}
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-glass-border bg-glass text-mint shadow-[0_4px_16px_rgba(91,230,178,0.25)] [&_svg]:h-[26px] [&_svg]:w-[26px] animate-pulse">
                <SparklesIcon />
              </span>
              <div className="flex flex-col gap-1.5">
                <h4 className="text-[17px] font-black text-strong">
                  هنوز نظری ثبت نشده!
                </h4>
                <p className="max-w-[40ch] text-[13px] leading-[1.9] text-muted">
                  اولین نفری باش که تجربه‌ات از یک خرید را با بقیه به اشتراک
                  می‌گذاری.
                </p>
              </div>
              <Link
                href="/write-review"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-[#06231b] bg-[linear-gradient(135deg,#5BE6B2_0%,#3FBF92_100%)] hover:shadow-[0_0_20px_rgba(91,230,178,0.4)] transition-all duration-300 transform hover:-translate-y-0.5"
              >
                اولین نظر را بنویس
              </Link>
            </div>
          )}
        </main>
      </Container>
      <Footer />
    </>
  );
}
