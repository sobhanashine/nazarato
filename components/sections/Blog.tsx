import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { blogPosts } from "@/lib/data/blog-posts";

export function Blog() {
  return (
    <section className="py-10">
      <div className="container">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <h2 className="text-[0.98rem] sm:text-[1.35rem] lg:text-[1.7rem] font-extrabold text-strong leading-[1.3] -tracking-[0.015em] min-w-0">
              بلاگ ما
            </h2>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] font-semibold text-mint whitespace-nowrap shrink-0 transition-[color,opacity] duration-200 hover:text-[#7BFFC9] [&_svg]:w-[11px] [&_svg]:h-[11px] sm:[&_svg]:w-[14px] sm:[&_svg]:h-[14px] [&_svg]:shrink-0"
            >
              <span>تمامی بلاگ‌ها</span>
              <ArrowLeftIcon />
            </Link>
          </div>
          <p className="text-[13px] sm:text-[14.5px] text-muted leading-[1.6]">
            ببین این مطالب بدردت میخوره یا نه.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 hide-scroll lg:overflow-x-visible">
        <div className="flex gap-5 px-5 py-2 min-w-max sm:px-6 lg:grid lg:grid-cols-4 lg:min-w-0 lg:px-12 lg:max-w-[1280px] lg:mx-auto xl:px-16">
          {blogPosts.slice(0, 4).map((b) => (
            <Link
              key={b.slug}
              href={`/blog/${b.slug}`}
              className="glass group flex flex-col w-[280px] shrink-0 overflow-hidden transition-[transform,border-color] duration-300 hover:-translate-y-[3px] hover:border-glass-border-hi lg:w-auto lg:shrink"
            >
              <div className="relative w-full aspect-[4/3] overflow-hidden after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(180deg,transparent_50%,rgba(6,8,15,0.55)_100%)] after:pointer-events-none">
                <Image
                  src={b.image}
                  alt={b.title}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out [filter:saturate(1.05)] group-hover:scale-[1.08]"
                />
              </div>
              <div className="px-6 pt-5 pb-7">
                <p className="blog-date text-[0.78rem] text-muted mb-2">{b.date}</p>
                <h5 className="text-[1.05rem] font-semibold text-strong mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                  {b.title}
                </h5>
                <p className="text-[0.85rem] font-normal text-muted whitespace-nowrap overflow-hidden text-ellipsis">
                  {b.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
