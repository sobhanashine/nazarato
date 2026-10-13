import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function HowItWorks() {
  return (
    <section aria-labelledby="useful-experience" className="border-t border-glass-border py-10 md:py-14">
      <Container>
        <div className="grid gap-7 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="text-[12px] font-semibold text-forest">از تجربه تا تصمیم</p>
            <h2 id="useful-experience" className="mt-2 text-[24px] font-bold leading-10 text-strong sm:text-[30px]">چه چیزی یک تجربه را مفید می‌کند؟</h2>
            <p className="mt-3 max-w-md text-[15px] leading-8 text-muted">فضا برای گفت‌وگو مناسب بود؟ سرویس چقدر طول کشید؟ دربارهٔ چیزی بنویس که به انتخاب نفر بعد کمک می‌کند.</p>
            <Link href="/about" className="mt-3 inline-flex min-h-11 items-center text-[14px] font-semibold text-forest">مسیر نظراتو <span aria-hidden className="ms-2">←</span></Link>
          </div>
          <div className="divide-y divide-glass-border">
            <div className="pb-5">
              <h3 className="text-[17px] font-bold text-strong">برای کسی که انتخاب می‌کند</h3>
              <p className="mt-2 text-[14px] leading-7 text-muted">نام و نشانی، زمان تجربه و دلیل نظر کنار هم قرار می‌گیرند. نبود تجربه یا اطلاعات هم روشن می‌ماند.</p>
            </div>
            <div className="pt-5">
              <h3 className="text-[17px] font-bold text-strong">برای صاحب کسب‌وکار</h3>
              <p className="mt-2 text-[14px] leading-7 text-muted">مسیر بعدی: بازخوردها به یک مسئلهٔ مشخص، شاهد و اقدام قابل پیگیری برسند.</p>
              <Link href="/for-business" className="mt-2 inline-flex min-h-11 items-center text-[13px] font-semibold text-forest">آشنایی با مسیر کسب‌وکارها <span aria-hidden className="ms-2">←</span></Link>
            </div>
            <p className="mt-5 pt-4 text-[12px] leading-6 text-muted">تحلیل فارسی و پیشنهاد شخصی هنوز در مرحلهٔ توسعه است.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
