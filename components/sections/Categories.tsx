import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { Container } from "@/components/ui/Container";
import { HIDE_SCROLL } from "@/components/ui/styles";
import { categories } from "@/lib/data/categories";

export function Categories() {
  return (
    <section className="py-10 pt-12 md:pt-16 lg:pt-20">
      <Container>
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

        <div className={`flex gap-4 overflow-x-auto px-5 pt-2 pb-3 -mx-5 [scroll-snap-type:x_mandatory] [scroll-padding-inline:1.25rem] ${HIDE_SCROLL} [&>*]:flex-[0_0_78%] [&>*]:max-w-[280px] [&>*]:[scroll-snap-align:start] sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:p-0 sm:m-0 sm:[&>*]:flex-initial sm:[&>*]:max-w-none lg:grid-cols-4`}>
          {categories.slice(0, 4).map((c) => (
            <CategoryCard key={c.href} category={c} />
          ))}
        </div>
      </Container>
    </section>
  );
}
