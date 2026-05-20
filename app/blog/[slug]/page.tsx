import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PostContent } from "@/components/blog/PostContent";
import { blogPosts, getBlogPost } from "@/lib/data/blog-posts";
import type { BlogPost } from "@/lib/data/blog-posts";
import {
  fetchPostBySlugFromWp,
  fetchPostSlugsFromWp,
  isWpEnabled,
} from "@/lib/wp";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  if (!isWpEnabled) return blogPosts.map((p) => ({ slug: p.slug }));
  try {
    const slugs = await fetchPostSlugsFromWp();
    return slugs.map((slug) => ({ slug }));
  } catch (err) {
    console.error("[blog] WP slug fetch failed, using static fallback:", err);
    return blogPosts.map((p) => ({ slug: p.slug }));
  }
}

async function loadPost(slug: string): Promise<BlogPost | null> {
  if (!isWpEnabled) return getBlogPost(slug) ?? null;
  try {
    const wp = await fetchPostBySlugFromWp(slug);
    return wp ?? getBlogPost(slug) ?? null;
  } catch (err) {
    console.error("[blog] WP post fetch failed, using static fallback:", err);
    return getBlogPost(slug) ?? null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: "بلاگ – نظراتو" };
  return {
    title: `${post.title} – نظراتو`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <Container>
        <Breadcrumb
          items={[
            { label: "خانه", href: "/" },
            { label: "بلاگ", href: "/blog" },
            { label: post.title },
          ]}
        />
      </Container>
      <PostContent post={post} />
      <Footer />
    </>
  );
}
