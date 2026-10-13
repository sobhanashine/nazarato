import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PostCard } from "@/components/blog/PostCard";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { Pagination } from "@/components/blog/Pagination";
import {
  blogPosts as fallbackPosts,
  filterPostsByTag,
} from "@/lib/data/blog-posts";
import type { BlogPost } from "@/lib/data/blog-posts";
import {
  blogTags,
  getTagBySlug,
  slugifyTaxonomy,
} from "@/lib/data/blog-taxonomies";
import { fetchPostsFromWp, isWpEnabled } from "@/lib/wp";

const PAGE_SIZE = 5;

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return blogTags.map((name) => ({ slug: slugifyTaxonomy(name) }));
}

async function loadPosts(): Promise<BlogPost[]> {
  if (!isWpEnabled) return fallbackPosts;
  try {
    return await fetchPostsFromWp();
  } catch (err) {
    console.error("[blog/tag] WP fetch failed, using static fallback:", err);
    return fallbackPosts;
  }
}

function parsePage(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = getTagBySlug(decodeURIComponent(slug));
  if (!tag) return { title: "بلاگ – نظراتو" };
  return {
    title: `بلاگ – #${tag} – نظراتو`,
    description: `نوشته‌های نظراتو با برچسب «${tag}».`,
  };
}

export default async function BlogTagPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { slug } = await params;
  const tag = getTagBySlug(decodeURIComponent(slug));
  if (!tag) notFound();

  const all = await loadPosts();
  const filtered = filterPostsByTag(all, tag);
  const { page: rawPage } = await searchParams;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(parsePage(rawPage), totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const basePath = `/blog/tag/${slugifyTaxonomy(tag)}`;

  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "راهنماهای نظراتو", href: "/blog" }, { label: `#${tag}` }]} />
        <main className="pb-20 pt-6 sm:pt-9">
          <header className="mb-8 border-b border-glass-border pb-7">
            <h1 className="text-[28px] font-extrabold leading-[1.5] text-strong sm:text-[38px]">{`نوشته‌های #${tag}`}</h1>
            <p className="mt-3 text-base leading-8 text-muted">{filtered.length === 0 ? "هنوز نوشته‌ای با این برچسب منتشر نشده." : `${filtered.length.toLocaleString("fa-IR")} نوشته با این برچسب`}</p>
          </header>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
            <section aria-label="نوشته‌ها" className="min-w-0">
              {visible.length === 0 ? <p className="rounded-xl border border-glass-border bg-paper p-6 text-base leading-8 text-muted">هیچ نوشته‌ای با این برچسب یافت نشد.</p> : <div className="flex flex-col gap-5">{visible.map(post => <PostCard key={post.slug} post={post} />)}</div>}
              <Pagination basePath={basePath} totalPages={totalPages} currentPage={page} />
            </section>
            <BlogSidebar />
          </div>
        </main>
      </Container>
      <Footer />
    </>
  );
}
