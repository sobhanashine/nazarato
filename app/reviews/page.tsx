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
import { categories } from "@/lib/data/categories";
import { getReviewsFromDb, type GlobalReviewSortKey } from "@/lib/data/reviews";
import { ReviewsSortSelect } from "@/components/review/ReviewsClient";
import { reviewsHref } from "@/components/review/href";

type SearchParams = Promise<{
  rating?: string;
  category?: string;
  ig?: string;
  sort?: string;
  page?: string;
}>;

export const metadata: Metadata = {
  title: "نظرات کاربران – نظراتو",
  description: "نظرات، نقدها و تجربه‌های واقعی کاربران از خرید آنلاین از وب‌سایت‌ها و فروشگاه‌های اینستاگرام.",
};

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const {
    rating: ratingParam,
    category: categoryParam,
    ig: igParam,
    sort: sortParam,
    page: pageParam,
  } = await searchParams;

  // 1. Parsing and validation
  const ratingNum = ratingParam ? parseInt(ratingParam, 10) : 0;
  const rating = [1, 2, 3, 4, 5].includes(ratingNum) ? ratingNum : 0;

  const validCategorySlugs = new Set(
    categories.map((c) => c.href.split("/").pop() || "")
  );
  const category =
    categoryParam && validCategorySlugs.has(categoryParam) ? categoryParam : "all";

  const ig = igParam === "1" || igParam === "true";

  const sort = (sortParam as GlobalReviewSortKey) || "newest";
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = 6;

  // 2. Fetch data
  const { reviews, total } = await getReviewsFromDb({
    rating,
    categorySlug: category,
    igOnly: ig,
    sort,
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit);
  const fa = (n: number) => n.toLocaleString("fa-IR");
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Pagination helper
  const paginationStep = (target: number, label: string, icon: React.ReactNode, enabled: boolean) =>
    enabled ? (
      <Link
        href={reviewsHref({ rating, category, ig, sort, page: target })}
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
        title="نظرات کاربران"
        subtitle="نظرات و تجربه‌های واقعی خریداران از وب‌سایت‌ها و فروشگاه‌های اینستاگرامی."
      />

      <Container>
        <main className="pb-20 lg:pb-32">
          {/* Filters Row */}
          <div className="flex flex-col gap-6 mb-10">
            {/* Category Filter Chips */}
            <div>
              <div className="text-[13.5px] font-bold text-strong mb-2.5">دسته‌بندی کسب‌وکار:</div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={reviewsHref({ rating, category: "all", ig, sort, page: 1 })}
                  className={`px-3 py-1.5 rounded-xl text-[13px] font-medium border transition-all duration-200 ${
                    category === "all"
                      ? "border-mint bg-mint/10 text-mint font-semibold shadow-[0_0_12px_rgba(91,230,178,0.15)]"
                      : "border-glass-border bg-glass text-muted hover:text-strong hover:border-glass-border-hi"
                  }`}
                >
                  همه دسته‌ها
                </Link>
                {categories.map((cat) => {
                  const catSlug = cat.href.split("/").pop() || "";
                  const isActive = catSlug === category;
                  return (
                    <Link
                      key={catSlug}
                      href={reviewsHref({ rating, category: catSlug, ig, sort, page: 1 })}
                      className={`px-3 py-1.5 rounded-xl text-[13px] font-medium border transition-all duration-200 ${
                        isActive
                          ? "border-mint bg-mint/10 text-mint font-semibold shadow-[0_0_12px_rgba(91,230,178,0.15)]"
                          : "border-glass-border bg-glass text-muted hover:text-strong hover:border-glass-border-hi"
                      }`}
                    >
                      {cat.title}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Rating Filter Chips & IG only */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-glass-border/40">
              <div>
                <div className="text-[13.5px] font-bold text-strong mb-2.5">امتیاز نقد:</div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={reviewsHref({ rating: 0, category, ig, sort, page: 1 })}
                    className={`px-3.5 py-1.5 rounded-xl text-[13px] font-medium border transition-all duration-200 ${
                      rating === 0
                        ? "border-mint bg-mint/10 text-mint font-semibold shadow-[0_0_12px_rgba(91,230,178,0.15)]"
                        : "border-glass-border bg-glass text-muted hover:text-strong hover:border-glass-border-hi"
                    }`}
                  >
                    همه امتیازها
                  </Link>
                  {[5, 4, 3, 2, 1].map((val) => {
                    const isActive = val === rating;
                    return (
                      <Link
                        key={val}
                        href={reviewsHref({ rating: val, category, ig, sort, page: 1 })}
                        className={`px-3.5 py-1.5 rounded-xl text-[13px] font-medium border transition-all duration-200 flex items-center gap-1 ${
                          isActive
                            ? "border-mint bg-mint/10 text-mint font-semibold shadow-[0_0_12px_rgba(91,230,178,0.15)]"
                            : "border-glass-border bg-glass text-muted hover:text-strong hover:border-glass-border-hi"
                        }`}
                      >
                        <span className="font-semibold tabular-nums">{fa(val)}</span>
                        <span className="text-[11px]">★</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* IG only toggle */}
              <div className="flex items-center self-start sm:self-center">
                <Link
                  href={reviewsHref({ rating, category, ig: !ig, sort, page: 1 })}
                  className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all duration-200 flex items-center gap-2 ${
                    ig
                      ? "border-mint bg-mint/10 text-mint shadow-[0_0_12px_rgba(91,230,178,0.15)]"
                      : "border-glass-border bg-glass text-muted hover:text-strong hover:border-glass-border-hi"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-colors ${
                    ig ? "border-mint bg-mint text-[#06231b]" : "border-glass-border bg-glass-strong"
                  }`}>
                    {ig && (
                      <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1.5 6 4.5 9 10.5 3" />
                      </svg>
                    )}
                  </span>
                  <span>فقط فروشگاه‌های اینستاگرامی</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Results Summary & Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-[13.5px] text-muted">
                نمایش {fa(reviews.length)} نظر از مجموع {fa(total)} مورد
              </p>
            </div>
            {reviews.length > 0 && (
              <ReviewsSortSelect rating={rating} category={category} ig={ig} sort={sort} />
            )}
          </div>

          {/* Reviews Grid */}
          {reviews.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav
                  aria-label="صفحه‌بندی نتایج"
                  className="mt-12 flex items-center justify-center gap-2"
                >
                  {paginationStep(page - 1, "صفحه قبلی", <ChevronRightIcon />, page > 1)}

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
                              href={reviewsHref({ rating, category, ig, sort, page: p })}
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

                  {paginationStep(page + 1, "صفحه بعدی", <ChevronLeftIcon />, page < totalPages)}
                </nav>
              )}
            </>
          ) : (
            <div className={`${GLASS} flex flex-col items-center gap-4.5 p-8 text-center sm:p-12 max-w-[560px] mx-auto`}>
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-glass-border bg-glass text-mint shadow-[0_4px_16px_rgba(91,230,178,0.25)] [&_svg]:h-[26px] [&_svg]:w-[26px] animate-pulse">
                <SparklesIcon />
              </span>
              <div className="flex flex-col gap-1.5">
                <h4 className="text-[17px] font-black text-strong">هیچ نظری یافت نشد!</h4>
                <p className="max-w-[40ch] text-[13px] leading-[1.9] text-muted">
                  هنوز نظری با فیلترهای مشخص‌شده ثبت نشده است. اولین نفری باشید که تجربه‌اش را به اشتراک می‌گذارد.
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
