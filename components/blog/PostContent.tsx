import Image from "next/image";
import type { BlogPost, ContentBlock } from "@/lib/data/blog-posts";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
} from "@/components/icons";

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "subhead":
      return <h4 className="post-subhead">{block.text}</h4>;
    case "paragraph":
      return <p className="post-para">{block.text}</p>;
    case "quote":
      return (
        <div className="container">
          <div className="quote-block">
            <p>{block.text}</p>
            <h6 className="author">{block.author}</h6>
          </div>
        </div>
      );
    case "learn-list":
      return (
        <div className="container learn-block">
          <h6>{block.heading}</h6>
          <ul className="learn-list">
            {block.items.map((item, i) => (
              <li key={i}>
                <div className="check">✓</div>
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </div>
      );
    case "image":
      return (
        <div className="container">
          <div className="post-secondary-image">
            <Image src={block.src} alt={block.alt ?? ""} fill sizes="(min-width: 1024px) 1000px, 100vw" />
          </div>
        </div>
      );
    case "requirements":
      return (
        <div className="container">
          <div className="requirements">
            <h6>{block.heading}</h6>
            <ul>
              {block.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        </div>
      );
  }
}

export function PostContent({ post }: { post: BlogPost }) {
  const paragraphBlocks = post.content.filter(
    (b) => b.type === "subhead" || b.type === "paragraph",
  );
  const restBlocks = post.content.filter(
    (b) => b.type !== "subhead" && b.type !== "paragraph",
  );

  return (
    <>
      <div className="container post-header">
        <h2 className="post-title">{post.title}</h2>
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
      </div>

      <div className="container">
        <div className="post-hero">
          <Image src={post.image} alt={post.title} fill priority sizes="(min-width: 1024px) 1200px, 100vw" />
        </div>
      </div>

      <div className="container post-body">
        {paragraphBlocks.map((b, i) => <Block key={i} block={b} />)}
      </div>

      {restBlocks.map((b, i) => <Block key={i} block={b} />)}

      <div className="container">
        <div className="share-block">
          <div className="share-left">
            <p className="share-text">این مطلب‌رو برای بقیه بفرست!</p>
            <div className="socials">
              <a href="#" className="soc-btn light" aria-label="اینستاگرام"><InstagramIcon /></a>
              <a href="#" className="soc-btn light" aria-label="توییتر"><TwitterIcon /></a>
              <a href="#" className="soc-btn light" aria-label="فیسبوک"><FacebookIcon /></a>
              <a href="#" className="soc-btn light" aria-label="لینکدین"><LinkedInIcon /></a>
            </div>
          </div>
          <div className="share-tags">
            {post.tags.map((t) => (
              <span key={t} className="tag-badge">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
