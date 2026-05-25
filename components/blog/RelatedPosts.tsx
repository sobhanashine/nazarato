import type { BlogPost } from "@/lib/data/blog-posts";
import { PostCard } from "./PostCard";

/**
 * Related-posts strip rendered at the bottom of a blog post. The parent
 * is responsible for picking the related posts (see `getRelatedPosts()`
 * in `lib/data/blog-posts.ts`); this component just lays them out.
 *
 * Renders nothing when the list is empty so the spacer doesn't show on
 * pages with no related candidates.
 */
export function RelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section
      className="mt-16 mb-20"
      aria-labelledby="related-posts-heading"
    >
      <h2
        id="related-posts-heading"
        className="text-2xl font-bold text-strong mb-8 -tracking-[0.01em]"
      >
        مطالب مرتبط
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
