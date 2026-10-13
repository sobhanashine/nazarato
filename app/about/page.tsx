import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "دربارهٔ نظراتو – تجربه‌های محلی، انتخاب‌های بهتر",
  description: "نظراتو از کافه‌ها و رستوران‌های رشت شروع می‌کند؛ با تجربهٔ مستقیم، اطلاعات قابل بررسی و مسیری برای شنیدن صدای مشتری.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "دربارهٔ نظراتو" }]} />
        <main className="pb-20 pt-6 sm:pt-10 lg:pb-28">
          <section className="grid gap-8 border-b border-glass-border pb-10 lg:grid-cols-[1.3fr_0.9fr] lg:gap-16 lg:pb-14">
            <div>
              <p className="mb-4 text-sm font-semibold text-mint">از رشت شروع می‌کنیم</p>
              <h1 className="max-w-[18ch] text-[2.1rem] font-extrabold leading-[1.45] text-strong sm:text-5xl">هر تجربه،<br />به درد انتخاب بعدی می‌خورد.</h1>
              <p className="mt-5 max-w-[52ch] text-base leading-8 text-muted">پیدا کردن نشانی یک کافه آسان‌تر از فهمیدن تجربهٔ آنجاست. نظراتو را می‌سازیم تا آدم‌ها جای مناسب را پیدا کنند، تجربهٔ مستقیمشان را بنویسند و با شواهد روشن‌تری انتخاب کنند.</p>
              <Link href="/search?area=rasht" className={`${BTN_PRIMARY} mt-7 min-h-12 px-6 py-3 text-base`}>کشف کافه و رستوران</Link>
            </div>
            <div className={`${GLASS} self-start p-6 sm:p-7`}>
              <h2 className="text-xl font-bold text-strong">یک شروع محلی</h2>
              <p className="mt-3 text-sm leading-7 text-muted">تمرکز اولیهٔ ما کافه‌ها و رستوران‌های رشت است؛ از گلسار و اطرافش، خیابان امام علی و بلوار توحید. اطلاعات هر کسب‌وکار باید پیش از ورود به فهرست عمومی بررسی شود.</p>
              <p className="mt-4 border-t border-glass-border pt-4 text-sm leading-7 text-muted">نسخهٔ عمومی هنوز در آغاز راه است. فهرست در حال تکمیل است و ورود پیامکی و ثبت تجربه با حساب واقعی، هنوز برای استفادهٔ عمومی آماده نیستند.</p>
            </div>
          </section>
          <section id="verification" className="py-10 sm:py-14" aria-labelledby="evidence-title">
            <p className="mb-2 text-sm font-semibold text-mint">اطلاعات باید قابل بررسی باشند</p>
            <h2 id="evidence-title" className="text-2xl font-bold leading-relaxed text-strong sm:text-3xl">سه چیز را از هم جدا می‌کنیم</h2>
            <div className="mt-7 grid gap-0 border-t border-glass-border md:grid-cols-3">
              {[
                { title: "اطلاعات یک مکان", text: "نام، نشانی و راه تماس از منبع مشخص می‌آیند. اطلاعات ناموجود را حدس نمی‌زنیم و مسیر اصلاح اطلاعات باید روشن باشد." },
                { title: "تجربهٔ یک نفر", text: "تجربهٔ مستقیم کاربر با اطلاعات پایهٔ مکان فرق دارد. نظرها، امتیازها و عکس‌های منابع دیگر، خودکار به تجربهٔ کاربران نظراتو تبدیل نمی‌شوند." },
                { title: "حضور مالک", text: "وجود یک صفحه به معنی تأیید صاحب آن نیست. اتصال صفحه به مالک، بررسی جداگانه دارد؛ پاسخ مالک هم جای تجربهٔ مشتری را نمی‌گیرد." },
              ].map(item => (
                <article key={item.title} className="border-b border-glass-border py-6 md:pe-7">
                  <h3 className="text-lg font-bold text-strong">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{item.text}</p>
                </article>
              ))}
            </div>
          </section>
          <section className={`${GLASS} grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12`} aria-labelledby="product-direction">
            <div>
              <p className="mb-3 text-xs font-bold text-pomegr">مسیر در حال توسعه</p>
              <h2 id="product-direction" className="text-2xl font-bold leading-relaxed text-strong">تجربه‌ها باید به کار بیایند.</h2>
            </div>
            <div>
              <p className="text-base leading-8 text-muted">هدف بعدی، پیشنهادهایی متناسب با موقعیت و سلیقهٔ شماست؛ پیشنهادهایی که دلیلشان به تجربه‌ها و انتخاب‌های مشخص وصل باشد. اگر شواهد کافی نباشد، باید همین را بگوییم.</p>
              <p className="mt-4 text-base leading-8 text-muted">برای مالک هم این تجربه‌ها باید به شناخت موضوع‌های تکرارشونده، انتخاب یک اقدام و بررسی نتیجه برسند. این ابزارها هنوز در حال توسعه‌اند و دادهٔ سلیقهٔ شخصی کاربران در اختیار کسب‌وکار قرار نمی‌گیرد.</p>
              <Link href="/for-business" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-mint underline underline-offset-4">مسیر نظراتو برای کسب‌وکارها</Link>
            </div>
          </section>
          <section className="mt-10 flex flex-col gap-4 border-t border-glass-border pt-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-strong">اطلاعاتی نیاز به اصلاح دارد؟</h2>
              <p className="mt-2 text-sm leading-7 text-muted">لینک صفحه و توضیح دقیق را بفرست؛ بازخورد شما بخشی از ساختن نظراتوست.</p>
            </div>
            <Link href="/contact#contact-form" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border border-glass-border bg-glass px-5 py-3 text-sm font-semibold text-strong transition-colors hover:border-mint">ارتباط با نظراتو</Link>
          </section>
        </main>
      </Container>
      <Footer />
    </>
  );
}
