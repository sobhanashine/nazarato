import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PostContent } from "@/components/blog/PostContent";
import { blogPosts, getBlogPost } from "@/lib/data/blog-posts";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
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
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <div className="container">
        <Breadcrumb
          items={[
            { label: "خانه", href: "/" },
            { label: "بلاگ", href: "/blog" },
            { label: post.title },
          ]}
        />
      </div>
      <PostContent post={post} />
      <Footer />
    </>
  );
}
