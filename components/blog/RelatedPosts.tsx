import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/lib/data/blog-posts";

/**
 * Related-posts strip at the bottom of a blog post.
 *
 * Layout:
 * - **Mobile**: horizontal snap-scroll row. Each card is ~78vw wide so a
 *   slice of the next card peeks in at the edge, hinting that the row is
 *   scrollable. The browser scrollbar is hidden — Persian/RTL users tap
 *   and swipe, they don't grab a thin scrollbar.
 * - **Desktop (≥ md)**: 3-column grid.
 *
 * We render a slimmer card here than the listing `<PostCard />` — the
 * full card duplicated three times reads as "more of the same article"
 * rather than a related-link strip. The whole card is a single <Link>
 * so the touch target is large on mobile.
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
        className="text-2xl font-bold text-strong mb-6 -tracking-[0.01em] md:mb-8"
      >
        مطالب مرتبط
      </h2>

      {/*
        Mobile: horizontal snap-scroll. `snap-x snap-mandatory` makes each
        card snap into place; `-mx-4 px-4` lets the row touch the screen
        edges while keeping content padded. Hide the scrollbar so the
        gesture is the affordance.
      */}
      <div
        className="
          flex gap-4 overflow-x-auto snap-x snap-mandatory
          -mx-4 px-4 pb-2
          [scrollbar-width:none] [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
          md:grid md:grid-cols-3 md:gap-6 md:mx-0 md:px-0 md:overflow-visible
        "
      >
        {posts.map((post) => (
          <RelatedCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}

function RelatedCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="
        group relative flex flex-col gap-3
        shrink-0 w-[78vw] max-w-[320px] snap-start
        md:w-auto md:max-w-none
        rounded-2xl overflow-hidden
        bg-glass border border-glass-border backdrop-blur-[14px]
        transition-[border-color,transform,box-shadow] duration-200
        hover:border-mint/50 hover:-translate-y-0.5
        hover:shadow-[0_10px_30px_-12px_rgba(91,230,178,0.35)]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint focus-visible:outline-offset-2
      "
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        <Image
          src={post.image}
          alt=""
          fill
          sizes="(min-width: 768px) 320px, 78vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(6,8,15,0.7))] pointer-events-none" />
        <span className="absolute top-3 right-3 text-[11px] font-medium text-mint bg-[rgba(6,8,15,0.7)] border border-mint/30 backdrop-blur-sm rounded-full px-2.5 py-1">
          {post.category}
        </span>
      </div>
      <div className="px-4 pb-4 flex flex-col gap-2 min-h-[88px]">
        <h3 className="text-[15px] font-semibold leading-[1.55] text-strong line-clamp-2 group-hover:text-mint transition-colors duration-200">
          {post.title}
        </h3>
        <span className="text-[12px] text-muted tabular-nums">{post.date}</span>
      </div>
    </Link>
  );
}
