import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { PageBanner } from "@/components/ui/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PostCard } from "@/components/blog/PostCard";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { Pagination } from "@/components/blog/Pagination";
import { FilterIcon } from "@/components/icons";
import { blogPosts as fallbackPosts } from "@/lib/data/blog-posts";
import type { BlogPost } from "@/lib/data/blog-posts";
import { fetchPostsFromWp, isWpEnabled } from "@/lib/wp";

export const metadata: Metadata = {
  title: "بلاگ‌ها – نظراتو",
  description: "بلاگ‌های نظراتو – راهنما، تحلیل و معرفی برندهای ایرانی",
};

/** Posts per page on the blog listing. */
const PAGE_SIZE = 5;

async function loadPosts(): Promise<BlogPost[]> {
  if (!isWpEnabled) return fallbackPosts;
  try {
    return await fetchPostsFromWp();
  } catch (err) {
    console.error("[blog] WP fetch failed, using static fallback:", err);
    return fallbackPosts;
  }
}

/** Coerce a `?page=` searchParam (Next can deliver string | string[] | undefined). */
function parsePage(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const posts = await loadPosts();
  const { page: rawPage } = await searchParams;
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const page = Math.min(parsePage(rawPage), totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const visible = posts.slice(start, start + PAGE_SIZE);

  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "بلاگ" }]} />
      </Container>
      <PageBanner title="صفحه بلاگ!" subtitle="بلاگ‌هارو نگاه کن و ببین کدوم بدردت میخوره!" />

      <Container>
        <div className="flex flex-col gap-8 mb-16 lg:flex-row-reverse lg:justify-between lg:gap-12 lg:mb-20">
          <main className="w-full lg:w-[58%]">
            <div className="mb-6 lg:hidden">
              <button
                className="inline-flex items-center gap-2 py-[0.65rem] px-4 bg-glass border border-glass-border rounded-xl shadow-[var(--shadow-sm)] backdrop-blur-[18px] backdrop-saturate-[160%] text-strong text-sm font-medium cursor-pointer transition-[background,border-color] duration-200 hover:bg-glass-hover hover:border-glass-border-hi [&_svg]:w-4 [&_svg]:h-4 [&_svg]:text-mint"
                type="button"
              >
                <span>فیلترها</span>
                <FilterIcon />
              </button>
            </div>

            <div className="flex flex-col gap-8">
              {visible.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>

            <Pagination
              basePath="/blog"
              totalPages={totalPages}
              currentPage={page}
            />
          </main>

          <BlogSidebar />
        </div>
      </Container>
      <Footer />
    </>
  );
}
