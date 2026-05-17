import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageBanner } from "@/components/ui/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PostCard } from "@/components/blog/PostCard";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { Pagination } from "@/components/blog/Pagination";
import { FilterIcon } from "@/components/icons";
import { blogPosts } from "@/lib/data/blog-posts";

export const metadata: Metadata = {
  title: "بلاگ‌ها – نظراتو",
  description: "بلاگ‌های نظراتو – راهنما، تحلیل و معرفی برندهای ایرانی",
};

export default function BlogListPage() {
  return (
    <>
      <Header />
      <div className="container">
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "بلاگ" }]} />
      </div>
      <PageBanner title="صفحه بلاگ!" subtitle="بلاگ‌هارو نگاه کن و ببین کدوم بدردت میخوره!" />

      <div className="container">
        <div className="blog-layout">
          <main className="blog-main">
            <div className="filter-row">
              <button className="btn-filter" type="button">
                <span>فیلترها</span>
                <FilterIcon />
              </button>
            </div>

            <div className="post-stack">
              {blogPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>

            <Pagination totalPages={3} />
          </main>

          <BlogSidebar />
        </div>
      </div>
      <Footer />
    </>
  );
}
