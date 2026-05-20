import Image from "next/image";
import type { BlogPost, ContentBlock } from "@/lib/data/blog-posts";
import { BlogMeta } from "@/components/blog/BlogMeta";
import { Container } from "@/components/ui/Container";
import { TAG_BADGE } from "@/components/ui/styles";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
} from "@/components/icons";

const socBtnLight =
  "flex items-center justify-center w-10 h-10 rounded-full text-muted transition-colors duration-200 hover:bg-glass-hover hover:text-mint";

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "subhead":
      return (
        <h4 className="text-[1.0625rem] leading-[1.75] font-semibold text-strong mb-2 md:mb-4">
          {block.text}
        </h4>
      );
    case "paragraph":
      return (
        <p className="text-base font-normal leading-[2] text-muted md:text-[1.0625rem] md:leading-[1.85]">
          {block.text}
        </p>
      );
    case "quote":
      return (
        <Container>
          <div className="p-6 rounded-[14px] border border-mint/25 border-r-4 border-r-mint backdrop-blur-[14px] mb-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,rgba(91,230,178,0.12),rgba(91,230,178,0.04))] md:px-16 md:pt-10 md:pb-9 md:mb-16">
            <p className="italic font-medium text-[0.95rem] leading-[1.85] text-strong mb-4 md:text-base">
              {block.text}
            </p>
            <h6 className="font-semibold text-base leading-[1.75] text-mint md:text-[1.0625rem]">
              {block.author}
            </h6>
          </div>
        </Container>
      );
    case "learn-list":
      return (
        <Container className="mb-8 md:mb-16">
          <h6 className="text-[1.1rem] font-bold leading-[1.6] text-strong mb-4 md:mb-6">
            {block.heading}
          </h6>
          <ul className="grid grid-cols-1 gap-2 list-none w-full md:grid-cols-2 md:gap-4 lg:w-4/5">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-center gap-[0.6rem]">
                <div className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-mint/15 border border-mint/30 text-mint text-[0.85rem] font-bold shrink-0">
                  ✓
                </div>
                <p className="text-[15px] font-normal leading-[2.2] text-muted">{item}</p>
              </li>
            ))}
          </ul>
        </Container>
      );
    case "image":
      return (
        <Container>
          <div className="relative w-full h-80 rounded-[1.25rem] overflow-hidden mb-8 border border-glass-border md:h-auto md:aspect-video md:mb-12 lg:w-5/6 lg:mx-auto">
            <Image
              src={block.src}
              alt={block.alt ?? ""}
              fill
              sizes="(min-width: 1024px) 1000px, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      );
    case "requirements":
      return (
        <Container>
          <div className="mb-8 lg:w-5/6 lg:mx-auto">
            <h6 className="text-[1.0625rem] leading-[1.75] font-semibold mb-2 text-strong">
              {block.heading}
            </h6>
            <ul className="pr-6 list-disc">
              {block.items.map((item, i) => (
                <li
                  key={i}
                  className="font-normal leading-[2.2] text-[15px] text-muted marker:text-mint"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      );
    case "html":
      return (
        <div
          className="wp-content"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
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
      <Container className="mb-8 md:mb-12">
        <h2 className="text-[1.6rem] font-extrabold text-strong leading-[1.35] mb-4 -tracking-[0.02em] md:text-[2.1rem] lg:mb-6">
          {post.title}
        </h2>
        <BlogMeta post={post} />
      </Container>

      <Container>
        <div className="relative w-full h-80 rounded-[1.25rem] overflow-hidden mb-8 border border-glass-border shadow-[var(--shadow-lg)] md:h-auto md:aspect-[16/7] md:mb-12">
          <Image
            src={post.image}
            alt={post.title}
            fill
            priority
            sizes="(min-width: 1024px) 1200px, 100vw"
            className="object-cover"
          />
        </div>
      </Container>

      <Container className="mb-8 [&>p+p]:mt-6">
        {paragraphBlocks.map((b, i) => <Block key={i} block={b} />)}
      </Container>

      {restBlocks.map((b, i) => <Block key={i} block={b} />)}

      <Container>
        <div className="flex flex-col gap-4 py-6 border-t border-b border-glass-border mb-12 lg:flex-row lg:justify-between lg:items-center lg:gap-0 lg:py-8 lg:mb-16 lg:w-5/6 lg:mx-auto">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
            <p className="text-[15px] font-medium leading-[1.75] text-strong">
              این مطلب‌رو برای بقیه بفرست!
            </p>
            <div className="flex gap-[0.2rem]">
              <a href="#" className={socBtnLight} aria-label="اینستاگرام"><InstagramIcon /></a>
              <a href="#" className={socBtnLight} aria-label="توییتر"><TwitterIcon /></a>
              <a href="#" className={socBtnLight} aria-label="فیسبوک"><FacebookIcon /></a>
              <a href="#" className={socBtnLight} aria-label="لینکدین"><LinkedInIcon /></a>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mx-auto w-fit md:mx-0">
            {post.tags.map((t) => (
              <span key={t} className={TAG_BADGE}>{t}</span>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
