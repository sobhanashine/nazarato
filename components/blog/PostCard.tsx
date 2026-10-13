import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { BlogMeta } from "@/components/blog/BlogMeta";
import { BTN_PRIMARY, GLASS, TAG_BADGE } from "@/components/ui/styles";
import type { BlogPost } from "@/lib/data/blog-posts";

export function PostCard({ post }: { post: BlogPost }) {
  const href = `/blog/${post.slug}`;

  return (
    <article className={`${GLASS} flex flex-col overflow-hidden`}>
      {post.image && <div className="relative w-full aspect-[4/3] overflow-hidden md:aspect-[2/1]">
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes="(min-width: 1024px) 600px, 100vw"
          className="object-cover"
        />
      </div>}
      <div className="p-5 sm:p-6">
        <BlogMeta post={post} />
        <h2 className="text-xl font-semibold text-strong mb-2 leading-8">
          {post.title}
        </h2>
        <p className="text-sm font-normal text-muted mb-4 leading-7 line-clamp-3 md:mb-6">
          {post.excerpt}
        </p>
        <div className="flex flex-col-reverse items-start justify-between gap-4 md:flex-row">
          <Link href={href} className={`${BTN_PRIMARY} py-3 px-6 text-[15px] [&_svg]:w-3.5 [&_svg]:h-3.5`}>
            <span>بیشتر بخوان</span>
            <ArrowLeftIcon />
          </Link>
          <div className="flex flex-wrap gap-2 justify-end md:gap-3">
            {post.tags.map((t) => (
              <span key={t} className={TAG_BADGE}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
