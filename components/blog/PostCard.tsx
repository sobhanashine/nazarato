import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import type { BlogPost } from "@/lib/data/blog-posts";

export function PostCard({ post }: { post: BlogPost }) {
  const href = `/blog/${post.slug}`;

  return (
    <article className="post-card">
      <div className="post-card-img">
        <Image src={post.image} alt={post.title} fill sizes="(min-width: 1024px) 600px, 100vw" />
      </div>
      <div className="post-card-body">
        <div className="blog-meta">
          <div className="blog-meta-author">
            <div
              className="blog-meta-avatar"
              style={post.author.color ? { background: post.author.color } : undefined}
            >
              {post.author.initial}
            </div>
            <span className="blog-meta-name">{post.author.name}</span>
          </div>
          <span>{post.category}</span>
          <span>{post.date}</span>
        </div>
        <h5>{post.title}</h5>
        <p className="post-card-excerpt">{post.excerpt}</p>
        <div className="post-card-footer">
          <Link href={href} className="btn-read-more">
            <span>بیشتر بخوان</span>
            <ArrowLeftIcon />
          </Link>
          <div className="post-card-tags">
            {post.tags.map((t) => (
              <span key={t} className="tag-badge">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
