import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { categories } from "@/lib/data/categories";

export function Categories() {
  return (
    <section className="py-10 pt-12 md:pt-16 lg:pt-20">
      <div className="container">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <h2 className="text-[0.98rem] sm:text-[1.35rem] lg:text-[1.7rem] font-extrabold text-strong leading-[1.3] -tracking-[0.015em] min-w-0">
              دسته‌بندی‌ها
            </h2>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] font-semibold text-mint whitespace-nowrap shrink-0 transition-[color,opacity] duration-200 hover:text-[#7BFFC9] [&_svg]:w-[11px] [&_svg]:h-[11px] sm:[&_svg]:w-[14px] sm:[&_svg]:h-[14px] [&_svg]:shrink-0"
            >
              <span>تمامی دسته‌بندی‌ها</span>
              <ArrowLeftIcon />
            </Link>
          </div>
          <p className="text-[13px] sm:text-[14.5px] text-muted leading-[1.6]">
            مشاهده دسته‌بندی‌های پربازدید.
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto px-5 pt-2 pb-3 -mx-5 [scroll-snap-type:x_mandatory] [scroll-padding-inline:1.25rem] hide-scroll [&>*]:flex-[0_0_78%] [&>*]:max-w-[280px] [&>*]:[scroll-snap-align:start] sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:p-0 sm:m-0 sm:[&>*]:flex-initial sm:[&>*]:max-w-none lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="glass flex flex-col py-6 px-7 cursor-pointer overflow-hidden transition-[transform,border-color,background] duration-300 hover:-translate-y-[3px] hover:border-glass-border-hi hover:bg-glass-hover before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(91,230,178,0),rgba(91,230,178,0.08))] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100 before:pointer-events-none"
            >
              <div className="relative w-[58px] h-[52px] mb-[1.1rem] flex items-end justify-end">
                {c.icon}
                <div className="absolute bottom-0 right-0 w-11 h-11 rounded-full bg-[radial-gradient(circle,rgba(91,230,178,0.22),rgba(91,230,178,0.05))] border border-mint/20 z-[1]" />
              </div>
              <h5 className="relative text-[1.1rem] font-semibold text-strong mb-[0.45rem]">
                {c.title}
              </h5>
              <p className="relative text-sm text-muted leading-[1.7] line-clamp-2">
                {c.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
