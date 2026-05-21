import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { Container } from "@/components/ui/Container";
import { ReviewCard } from "@/components/ui/ReviewCard";
import { HIDE_SCROLL } from "@/components/ui/styles";
import { recentReviews } from "@/lib/data/reviews";

export function RecentReviews() {
  return (
    <section className="py-10">
      <Container>
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <h2 className="text-[0.98rem] sm:text-[1.35rem] lg:text-[1.7rem] font-extrabold text-strong leading-[1.3] -tracking-[0.015em] min-w-0">
              نظرات{" "}
              <strong className="font-[inherit] bg-[linear-gradient(135deg,#5BE6B2_0%,#7B89FF_100%)] bg-clip-text text-transparent">
                اخیر
              </strong>{" "}
              فروشگاه‌های آنلاین
            </h2>
            <Link
              href="/reviews"
              className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] font-semibold text-mint whitespace-nowrap shrink-0 transition-[color,opacity] duration-200 hover:text-[#7BFFC9] [&_svg]:w-[11px] [&_svg]:h-[11px] sm:[&_svg]:w-[14px] sm:[&_svg]:h-[14px] [&_svg]:shrink-0"
            >
              <span>تمامی نظرات</span>
              <ArrowLeftIcon />
            </Link>
          </div>
          <p className="text-[13px] sm:text-[14.5px] text-muted leading-[1.6]">
            ثبت‌شده توسط کاربران.
          </p>
        </div>

        <div className={`flex items-stretch gap-4 overflow-x-auto px-5 py-2 -mx-5 [scroll-snap-type:x_mandatory] [scroll-padding-inline:1.25rem] ${HIDE_SCROLL} [&>*]:flex-[0_0_85%] [&>*]:max-w-[340px] [&>*]:[scroll-snap-align:start] sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:p-0 sm:m-0 sm:[&>*]:flex-initial sm:[&>*]:max-w-none lg:grid-cols-3`}>
          {recentReviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </Container>
    </section>
  );
}
