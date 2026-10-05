import Image from "next/image";
import type { BlogPost, ContentBlock } from "@/lib/data/blog-posts";
import { BlogMeta } from "@/components/blog/BlogMeta";
import { SharePostButton } from "@/components/blog/SharePostButton";
import { Container } from "@/components/ui/Container";
import { TAG_BADGE } from "@/components/ui/styles";

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "subhead":
      return <h2 className="pt-3 text-xl font-bold leading-8 text-strong sm:text-2xl">{block.text}</h2>;
    case "paragraph":
      return <p className="text-base leading-8 text-muted sm:text-lg sm:leading-9">{block.text}</p>;
    case "quote":
      return (
        <blockquote className="rounded-xl border border-glass-border border-s-4 border-s-mint bg-paper p-5 sm:p-7">
          <p className="text-base leading-8 text-strong">{block.text}</p>
          <p className="mt-3 text-sm font-semibold text-forest">{block.author}</p>
        </blockquote>
      );
    case "learn-list":
      return (
        <section>
          <h2 className="mb-4 text-xl font-bold leading-8 text-strong">{block.heading}</h2>
          <ul className="space-y-3">
            {block.items.map((item, index) => <li key={index} className="flex items-start gap-3 text-base leading-8 text-muted"><span aria-hidden className="text-forest">✓</span><span>{item}</span></li>)}
          </ul>
        </section>
      );
    case "image":
      return block.src ? (
        <figure className="relative aspect-video w-full overflow-hidden rounded-xl border border-glass-border">
          <Image src={block.src} alt={block.alt ?? ""} fill sizes="(min-width: 1024px) 760px, 100vw" className="object-cover" />
        </figure>
      ) : null;
    case "requirements":
      return (
        <section>
          <h2 className="mb-3 text-xl font-bold leading-8 text-strong">{block.heading}</h2>
          <ul className="list-disc space-y-2 ps-5 text-base leading-8 text-muted marker:text-mint">
            {block.items.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>
      );
    case "html":
      return <div className="wp-content" dangerouslySetInnerHTML={{ __html: block.html }} />;
  }
}

export function PostContent({ post }: { post: BlogPost }) {
  return (
    <article className="pb-8 pt-5 sm:pt-8">
      <Container>
        <header className="mx-auto mb-8 max-w-[760px] border-b border-glass-border pb-6 sm:mb-10">
          <h1 className="mb-5 break-words text-[28px] font-extrabold leading-[1.6] text-strong sm:text-[38px]">{post.title}</h1>
          <BlogMeta post={post} />
        </header>
        {post.image && (
          <div className="relative mx-auto mb-8 aspect-video w-full max-w-[960px] overflow-hidden rounded-xl border border-glass-border sm:mb-10">
            <Image src={post.image} alt={post.title} fill priority sizes="(min-width: 1024px) 960px, 100vw" className="object-cover" />
          </div>
        )}
        <div className="mx-auto max-w-[760px] space-y-6">
          {post.content.map((block, index) => <Block key={index} block={block} />)}
        </div>
        <footer className="mx-auto mt-9 flex max-w-[760px] flex-col gap-5 border-y border-glass-border py-6 sm:mt-12 sm:flex-row sm:items-start sm:justify-between">
          <SharePostButton title={post.title} />
          <div className="flex flex-wrap items-center gap-2">{post.tags.map(tag => <span key={tag} className={TAG_BADGE}>{tag}</span>)}</div>
        </footer>
      </Container>
    </article>
  );
}
