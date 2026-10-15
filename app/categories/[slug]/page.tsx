import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageBanner } from "@/components/ui/PageBanner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from "@/components/icons";
import { GLASS } from "@/components/ui/styles";
import { categories } from "@/lib/data/categories";
import {
  getBusinessesByCategory,
  categorySubcategories,
  type BusinessSortKey,
} from "@/lib/data/businesses";
import { CategorySortSelect, categoryHref } from "@/components/categories/CategoryDetailClient";

type Params = { slug: string };
type SearchParams = {
  sort?: string;
  sub?: string;
  page?: string;
};

export function generateStaticParams(): Params[] {
  return categories.map((c) => {
    const slug = c.href.split("/").pop() || "";
    return { slug };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = categories.find((c) => c.href === `/categories/${slug}`);
  if (!cat) return { title: "دسته‌بندی – نظراتو" };
  return {
    title: `${cat.title} – نظراتو`,
    description: cat.desc,
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const { sort: sortParam, sub: subParam, page: pageParam } = await searchParams;

  const cat = categories.find((c) => c.href === `/categories/${slug}`);
  if (!cat) notFound();

  const sort = (sortParam as BusinessSortKey) || "rating";
  const subcategory = subParam || "همه";
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = 6;

  const { businesses, total } = await getBusinessesByCategory(slug, {
    sort,
    subcategory,
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit);
  const subcategories = categorySubcategories[slug] || ["همه"];
  const fa = (n: number) => n.toLocaleString("fa-IR");
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const paginationStep = (target: number, label: string, icon: React.ReactNode, enabled: boolean) =>
    enabled ? (
      <Link
        href={categoryHref(slug, { sort, sub: subcategory, page: target })}
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
            { label: "دسته‌بندی‌ها", href: "/categories" },
            { label: cat.title },
          ]}
        />
      </Container>

      <PageBanner
        title={cat.title}
        subtitle={cat.desc}
      />

      <Container>
        <main className="pb-20 lg:pb-32">
          {/* Subcategory Filter Chips */}
          {subcategories.length > 1 && (
            <div className="mb-8 flex flex-wrap items-center gap-2 justify-center">
              {subcategories.map((subcat) => {
                const isActive = subcat === subcategory;
                return (
                  <Link
                    key={subcat}
                    href={categoryHref(slug, { sort, sub: subcat, page: 1 })}
                    className={`px-4 py-2 rounded-xl text-[14px] font-medium border transition-all duration-200 ${
                      isActive
                        ? "border-mint bg-mint/10 text-mint font-semibold shadow-[0_0_12px_rgba(91,230,178,0.15)]"
                        : "border-glass-border bg-glass text-muted hover:text-strong hover:border-glass-border-hi"
                    }`}
                  >
                    {subcat}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-[18px] font-bold text-strong mb-1">
                {subcategory !== "همه" ? `کسب‌وکارهای «${subcategory}»` : "همه کسب‌وکارها"}
              </h3>
              <p className="text-[13px] text-muted">
                نمایش {fa(businesses.length)} کسب‌وکار از مجموع {fa(total)} مورد
              </p>
            </div>
            {businesses.length > 0 && (
              <CategorySortSelect slug={slug} sort={sort} sub={subcategory} />
            )}
          </div>

          {/* Main Grid or Empty State */}
          {businesses.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {businesses.map((b) => (
                  <BusinessCard key={b.slug} business={b} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-2" aria-label="صفحه‌بندی نتایج">
                  {paginationStep(page - 1, "صفحه قبلی", <ChevronRightIcon />, page > 1)}
                  {pages.map((p) =>
                    p === page ? (
                      <span
                        key={p}
                        aria-current="page"
                        aria-label={`صفحه ${fa(p)}`}
                        className="h-10 min-w-10 px-2 rounded-full inline-flex items-center justify-center text-[0.95rem] tabular-nums font-bold text-[#06231b] bg-[linear-gradient(135deg,#5BE6B2_0%,#3FBF92_100%)] shadow-[0_6px_18px_-4px_rgba(91,230,178,0.55),inset_0_1px_0_rgba(255,255,255,0.45)]"
                      >
                        {fa(p)}
                      </span>
                    ) : (
                      <Link
                        key={p}
                        href={categoryHref(slug, { sort, sub: subcategory, page: p })}
                        aria-label={`صفحه ${fa(p)}`}
                        className="h-10 min-w-10 px-2 rounded-full inline-flex items-center justify-center text-[0.95rem] tabular-nums border border-glass-border bg-glass text-strong hover:border-mint/50 hover:text-mint hover:bg-glass-hover transition-colors duration-200"
                      >
                        {fa(p)}
                      </Link>
                    )
                  )}
                  {paginationStep(page + 1, "صفحه بعدی", <ChevronLeftIcon />, page < totalPages)}
                </nav>
              )}
            </>
          ) : (
            <div className={`${GLASS} flex flex-col items-center justify-center px-6 py-16 text-center max-w-xl mx-auto rounded-3xl border border-glass-border-hi shadow-xl`}>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-glass-border bg-glass-strong text-mint [&_svg]:h-7 [&_svg]:w-7 animate-pulse">
                <SparklesIcon />
              </div>
              <h3 className="mb-3 text-[18px] font-bold text-strong">هنوز کسب‌وکاری در این دسته‌بندی معرفی نشده است</h3>
              <p className="mb-8 text-[14px] text-muted leading-relaxed">
                شما می‌توانید اولین نفری باشید که کسب‌وکار یا فروشگاهی را در دسته‌بندی «{cat.title}» معرفی می‌کند و درباره آن نظر می‌نویسد.
              </p>
              <Link
                href="/write-review"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-[#06231b] bg-[linear-gradient(135deg,#5BE6B2_0%,#3FBF92_100%)] hover:shadow-[0_0_20px_rgba(91,230,178,0.4)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <SparklesIcon className="w-4 h-4 shrink-0" />
                <span>اولین کسب‌وکار را معرفی کن</span>
              </Link>
            </div>
          )}
        </main>
      </Container>
      <Footer />
    </>
  );
}
