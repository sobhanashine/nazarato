import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageBanner } from "@/components/ui/PageBanner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { IgShopCard } from "@/components/ui/IgShopCard";
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from "@/components/icons";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";
import {
  nicheTabs,
  getInstagramShopsFromDb,
  type Niche,
  type InstagramShopSortKey,
} from "@/lib/data/instagram-shops";
import { InstagramShopsSortSelect } from "@/components/instagram-shops/InstagramShopsClient";
import { instagramShopsHref } from "@/components/instagram-shops/href";

type SearchParams = Promise<{
  niche?: string;
  sort?: string;
  page?: string;
}>;

export const metadata: Metadata = {
  title: "فروشگاه‌های اینستاگرامی – نظراتو",
  description: "لیست و دایرکتوری کامل محبوب‌ترین فروشگاه‌های اینستاگرام به همراه نقد و بررسی واقعی کاربران.",
};

export default async function InstagramShopsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { niche: nicheParam, sort: sortParam, page: pageParam } = await searchParams;

  const niche = (nicheParam as Niche) || "all";
  const sort = (sortParam as InstagramShopSortKey) || "rating";
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = 8;

  const { shops, total } = await getInstagramShopsFromDb({
    sort,
    niche,
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit);
  const fa = (n: number) => n.toLocaleString("fa-IR");
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const selectedNicheLabel = nicheTabs.find((t) => t.id === niche)?.label || "همه";

  const paginationStep = (target: number, label: string, icon: React.ReactNode, enabled: boolean) =>
    enabled ? (
      <Link
        href={instagramShopsHref({ niche, sort, page: target })}
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
            { label: "فروشگاه‌های اینستاگرامی" },
          ]}
        />
      </Container>

      <PageBanner
        title="فروشگاه‌های اینستاگرامی"
        subtitle="محبوب‌ترین شاپ‌های اینستاگرام را بر اساس امتیاز، تعداد نظر و دسته‌بندی کشف کنید."
      />

      <Container>
        <main className="pb-20 lg:pb-32">
          {/* Niche Tabs Chips */}
          <div className="mb-8 flex flex-wrap items-center gap-2 justify-center">
            {nicheTabs.map((tab) => {
              const isActive = tab.id === niche;
              return (
                <Link
                  key={tab.id}
                  href={instagramShopsHref({ niche: tab.id, sort, page: 1 })}
                  className={`px-4 py-2 rounded-xl text-[14px] font-medium border transition-all duration-200 ${
                    isActive
                      ? "border-mint bg-mint/10 text-mint font-semibold shadow-[0_0_12px_rgba(91,230,178,0.15)]"
                      : "border-glass-border bg-glass text-muted hover:text-strong hover:border-glass-border-hi"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-[18px] font-bold text-strong mb-1">
                {niche !== "all" ? `فروشگاه‌های نیش «${selectedNicheLabel}»` : "همه فروشگاه‌ها"}
              </h3>
              <p className="text-[13px] text-muted">
                نمایش {fa(shops.length)} فروشگاه از مجموع {fa(total)} مورد
              </p>
            </div>
            {shops.length > 0 && (
              <InstagramShopsSortSelect niche={niche} sort={sort} />
            )}
          </div>

          {/* Main Grid or Empty State */}
          {shops.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shops.map((s) => (
                  <IgShopCard key={s.handle} shop={s} />
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
                              href={instagramShopsHref({ niche, sort, page: p })}
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
                <h4 className="text-[17px] font-black text-strong">هنوز فروشگاهی در این نیش ثبت نشده!</h4>
                <p className="max-w-[40ch] text-[13px] leading-[1.9] text-muted">
                  تو اولین کسی باش که یک شاپ اینستاگرامی معتبر معرفی می‌کند و نقدش را می‌نویسد.
                </p>
              </div>
              <Link
                href="/write-review"
                className={`${BTN_PRIMARY} relative z-[1] px-6 py-2.5 text-[0.88rem]`}
              >
                <span
                  aria-hidden
                  className="absolute inset-[-8px] rounded-full bg-[radial-gradient(circle,rgba(91,230,178,0.45),transparent_70%)] blur-[10px] z-[-1] pointer-events-none animate-[fab-pulse_2.6s_ease-in-out_infinite]"
                />
                اولین فروشگاه را معرفی کن
              </Link>
            </div>
          )}
        </main>
      </Container>
      <Footer />
    </>
  );
}
