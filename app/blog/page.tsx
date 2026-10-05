import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PostCard } from "@/components/blog/PostCard";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { Pagination } from "@/components/blog/Pagination";
import { blogPosts as fallbackPosts } from "@/lib/data/blog-posts";
import type { BlogPost } from "@/lib/data/blog-posts";
import { fetchPostsFromWp, isWpEnabled } from "@/lib/wp";

export const metadata: Metadata = {
  title: "راهنماهای نظراتو",
  description: "راهنمای انتخاب محلی، نوشتن تجربهٔ مفید و شنیدن صدای مشتری در نظراتو.",
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
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "راهنماهای نظراتو" }]} />
        <main className="pb-20 pt-6 sm:pt-9">
          <header className="mb-8 border-b border-glass-border pb-7 sm:mb-10">
            <p className="mb-2 text-sm font-semibold text-forest">انتخاب محلی و تجربهٔ دست اول</p>
            <h1 className="text-[28px] font-extrabold leading-[1.5] text-strong sm:text-[38px]">راهنماهای نظراتو</h1>
            <p className="mt-4 max-w-[60ch] text-base leading-8 text-muted">برای انتخاب یک مکان، نوشتن تجربهٔ مفید و فهمیدن بازخورد مشتری؛ از همین قدم‌های ساده شروع کن.</p>
          </header>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
            <section aria-label="راهنماها" className="min-w-0">
              <div className="flex flex-col gap-5">{visible.map(post => <PostCard key={post.slug} post={post} />)}</div>
              <Pagination basePath="/blog" totalPages={totalPages} currentPage={page} />
            </section>
            <BlogSidebar />
          </div>
        </main>
      </Container>
      <Footer />
    </>
  );
}
