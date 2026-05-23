import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getUserBookmarks, getPopularBusinesses } from "@/lib/data/bookmarks";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { IgShopCard } from "@/components/ui/IgShopCard";
import { Container } from "@/components/ui/Container";
import type { InstagramShop } from "@/lib/data/instagram-shops";
import type { Business } from "@/lib/data/businesses";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session?.id) {
    redirect("/login?next=/saved");
  }

  const { tab } = await searchParams;
  const currentTab = tab === "ig" ? "ig" : "businesses";

  // Fetch bookmarks based on selected tab
  const typeFilter = currentTab === "ig" ? "ig_shop" : "company";
  const bookmarks = await getUserBookmarks(session.id, typeFilter);

  // If empty, fetch popular businesses
  const popularBusinesses = bookmarks.length === 0 ? await getPopularBusinesses() : [];

  const handleTabClick = (t: string) => {
    return `/saved?tab=${t}`;
  };

  return (
    <Container className="pb-16 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-strong">ذخیره‌شده‌ها</h1>
        <p className="mt-2 text-sm text-muted">
          کسب‌وکارها و فروشگاه‌هایی که برای دسترسی سریع‌تر ذخیره کرده‌اید.
        </p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-glass-border">
        <Link
          href={handleTabClick("businesses")}
          className={`px-4 py-2.5 text-[0.88rem] font-bold border-b-2 transition-colors duration-200 ${
            currentTab === "businesses"
              ? "border-mint text-strong"
              : "border-transparent text-muted hover:text-strong"
          }`}
          scroll={false}
        >
          کسب‌وکارها
        </Link>
        <Link
          href={handleTabClick("ig")}
          className={`px-4 py-2.5 text-[0.88rem] font-bold border-b-2 transition-colors duration-200 ${
            currentTab === "ig"
              ? "border-mint text-strong"
              : "border-transparent text-muted hover:text-strong"
          }`}
          scroll={false}
        >
          فروشگاه‌های اینستاگرامی
        </Link>
      </div>

      {bookmarks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((b) => {
            if (currentTab === "ig") {
              const shop: InstagramShop = {
                href: `/shop/${b.slug}`,
                slug: b.slug,
                niche: "clothing", // arbitrary since we don't have niche from Business easily
                name: b.name,
                handle: `@${b.slug}`,
                initial: b.initial,
                color: b.color,
                score: b.score,
                reviews: b.reviews,
              };
              return <IgShopCard key={b.slug} shop={shop} isBookmarked={true} />;
            }
            return <BusinessCard key={b.slug} business={b} isBookmarked={true} />;
          })}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-glass border border-glass-border">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
            </svg>
          </div>
          <h2 className="text-[1.05rem] font-extrabold text-strong">
            هنوز چیزی ذخیره نکرده‌اید
          </h2>
          <p className="mt-2 max-w-[34ch] text-[0.88rem] leading-[1.8] text-muted">
            شما هیچ {currentTab === "ig" ? "فروشگاه اینستاگرامی" : "کسب‌وکاری"} را ذخیره نکرده‌اید. با لمس نماد نشانک می‌توانید آن‌ها را به اینجا اضافه کنید.
          </p>

          {popularBusinesses.length > 0 && currentTab === "businesses" && (
            <div className="mt-12 w-full text-right">
              <h3 className="mb-4 text-[1.05rem] font-bold text-strong border-b border-glass-border pb-2">
                کسب‌وکارهای محبوب
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 text-right">
                {popularBusinesses.map((b) => (
                  <BusinessCard key={b.slug} business={b} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
