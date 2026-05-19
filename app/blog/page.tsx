import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
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

async function loadPosts(): Promise<BlogPost[]> {
  if (!isWpEnabled) return fallbackPosts;
  try {
    return await fetchPostsFromWp();
  } catch (err) {
    console.error("[blog] WP fetch failed, using static fallback:", err);
    return fallbackPosts;
  }
}

export default async function BlogListPage() {
  const posts = await loadPosts();

  return (
    <>
      <Header />
      <div className="container">
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "بلاگ" }]} />
      </div>
      <PageBanner title="صفحه بلاگ!" subtitle="بلاگ‌هارو نگاه کن و ببین کدوم بدردت میخوره!" />

      <div className="container">
        <div className="flex flex-col gap-8 mb-16 lg:flex-row-reverse lg:justify-between lg:gap-12 lg:mb-20">
          <main className="w-full lg:w-[58%]">
            <div className="mb-6 lg:hidden">
              <button className="btn-filter" type="button">
                <span>فیلترها</span>
                <FilterIcon />
              </button>
            </div>

            <div className="flex flex-col gap-8">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>

            <Pagination totalPages={Math.max(1, Math.ceil(posts.length / 5))} />
          </main>

          <BlogSidebar />
        </div>
      </div>
      <Footer />
    </>
  );
}
