import type { BlogPost } from "@/lib/data/blog-posts";

/** Author avatar + name + category + date row, shared by PostCard and PostContent. */
export function BlogMeta({ post }: { post: BlogPost }) {
  const metaText = "text-xs text-muted font-normal md:text-sm";

  return (
    <div className="flex items-center gap-6 mb-3 flex-wrap md:gap-8 md:mb-4">
      <div className="flex items-center gap-1.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[#06231b] text-xs font-bold shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] bg-[linear-gradient(135deg,#5BE6B2,#7B89FF)]"
          style={post.author.color ? { background: post.author.color } : undefined}
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
