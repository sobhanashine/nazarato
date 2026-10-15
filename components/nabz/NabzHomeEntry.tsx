import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BTN_PRIMARY, GLASS, TAG_BADGE } from "@/components/ui/styles";

/** An additive entry to the recovered product loop in main's visual language. */
export function NabzHomeEntry() {
  return (
    <section aria-labelledby="nabz-home-title" className="relative py-8 sm:py-14">
      <Container>
        <div className={`${GLASS} overflow-hidden p-6 sm:p-9`}>
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-lapis/10 blur-3xl" />
          <div className="relative grid gap-7 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-12">
            <div>
              <span className={TAG_BADGE}>نبض رشت · سلیقهٔ تو، انتخاب محلی</span>
              <h2 id="nabz-home-title" className="mt-4 text-2xl font-extrabold leading-relaxed text-strong sm:text-3xl">
                امروز کجا بریم؟
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-8 text-muted sm:text-base">
                پنج انتخاب کوتاه بین مکان‌هایی که می‌شناسی. بعد، پیشنهادی که دلیلش
                را می‌بینی؛ با تجربه‌های دست‌اول و سلیقه‌ای که خصوصی می‌ماند.
              </p>
              <Link href="/nabz" className={`${BTN_PRIMARY} mt-5 min-h-11 px-6 py-3 text-sm`}>
                شروع نبض رشت
                <span aria-hidden>←</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3" aria-label="موقعیت‌های نبض رشت">
              {[
                ["date", "قرار دونفره", "برای کنار هم بودن"],
                ["laptop", "کار با لپ‌تاپ", "برای وقتِ کار"],
                ["budget", "انتخاب اقتصادی", "با بودجهٔ مشخص"],
                ["local-food", "غذای محلی", "برای مزه‌های رشت"],
              ].map(([scenario, title, detail]) => (
                <Link key={scenario} href={`/nabz?scenario=${scenario}`} className="group rounded-2xl border border-glass-border bg-glass px-4 py-5 transition-colors hover:border-mint/40 hover:bg-glass-hover focus-visible:outline-2 focus-visible:outline-mint">
                  <strong className="block text-sm font-bold text-strong group-hover:text-mint">{title}</strong>
                  <span className="mt-2 block text-xs leading-6 text-muted">{detail}</span>
                </Link>
              ))}
            </div>
          </div>
          <p className="relative mt-6 border-t border-glass-border pt-4 text-xs leading-7 text-muted">
            شروع بدون ورود است. ذخیرهٔ سلیقه بین دستگاه‌ها به حساب نیاز دارد؛ وقتی
            تجربهٔ معتبر کافی نباشد، به‌جای پیشنهاد ساختگی همین را می‌گوییم.
          </p>
        </div>
      </Container>
    </section>
  );
}
