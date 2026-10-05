import type { BlogPost } from "@/lib/data/blog-posts";

/** Author avatar + name + category + date row, shared by PostCard and PostContent. */
export function BlogMeta({ post }: { post: BlogPost }) {
  const metaText = "text-xs text-muted font-normal md:text-sm";

  return (
    <div className="flex items-center gap-6 mb-3 flex-wrap md:gap-8 md:mb-4">
      <div className="flex items-center gap-1.5">
        <div
          className="w-8 h-8 rounded-lg border border-mint/15 bg-mint/5 flex items-center justify-center text-forest text-xs font-bold shrink-0"
          aria-hidden
        >
          {post.author.initial}
        </div>
        <span className={metaText}>{post.author.name}</span>
      </div>
      <span className={metaText}>{post.category}</span>
      <span className={`${metaText} tabular-nums`}>{post.date}</span>
    </div>
  );
}
