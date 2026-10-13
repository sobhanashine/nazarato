import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "برای کافه‌ها و رستوران‌ها – نظراتو",
  description: "مسیر نظراتو برای کسب‌وکارهای رشت: تجربهٔ مستقیم مشتری، شناخت موضوعات تکرارشونده و بررسی نتیجهٔ یک تغییر.",
};

const steps = [
  { title: "تجربهٔ مشتری", text: "مشتری توضیح می‌دهد کجا رفته، چه تجربه‌ای داشته و چه چیزی برایش مهم بوده است." },
  { title: "موضوع تکرارشونده", text: "تجربه‌های کافی و قابل استناد، موضوع‌هایی مانند برخورد، کیفیت و زمان انتظار را روشن می‌کنند." },
  { title: "یک اقدام مشخص", text: "مالک با دیدن تجربه‌های پشتیبان، یک تغییر عملی انتخاب می‌کند؛ نتیجهٔ تحلیل هم باید قابل اصلاح باشد." },
  { title: "بررسی نتیجه", text: "تجربه‌های بعدی کمک می‌کنند ببینیم چه چیزی تغییر کرده و چه چیزی هنوز نیاز به توجه دارد." },
];

export default function ForBusinessPage() {
  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "برای کسب‌وکارها" }]} />
        <main className="pb-20 pt-6 sm:pt-10 lg:pb-28">
          <section className="grid gap-8 border-b border-glass-border pb-10 lg:grid-cols-[1.35fr_0.85fr] lg:gap-16 lg:pb-14">
            <div>
              <p className="mb-4 text-sm font-semibold text-mint">برای کافه‌ها و رستوران‌های رشت</p>
              <h1 className="max-w-[18ch] text-[2.1rem] font-extrabold leading-[1.45] text-strong sm:text-5xl">از تجربهٔ مشتری،<br />به یک تغییر بهتر.</h1>
              <p className="mt-5 max-w-[52ch] text-base leading-8 text-muted">
                یک امتیاز، همهٔ داستان را نمی‌گوید. نظراتو را می‌سازیم تا تجربه‌های مستقیم مشتریان به موضوع‌های قابل فهم و تصمیم‌های عملی برای کسب‌وکار تبدیل شوند.
              </p>
              <Link href="/contact#contact-form" className={`${BTN_PRIMARY} mt-7 min-h-12 px-6 py-3 text-base`}>کسب‌وکارت را معرفی کن</Link>
            </div>
            <aside className={`${GLASS} self-start p-6 sm:p-7`} aria-labelledby="business-current-status">
              <p className="mb-3 text-xs font-bold text-pomegr">نسخهٔ اولیه</p>
              <h2 id="business-current-status" className="text-xl font-bold text-strong">الان از کجا شروع کنیم؟</h2>
              <p className="mt-3 text-sm leading-7 text-muted">نام کافه یا رستوران، محدوده و راه تماس عمومی را برایمان بفرست. می‌توانی اطلاعات را اصلاح کنی یا دربارهٔ یک پایلوت گفت‌وگو کنی.</p>
              <p className="mt-4 border-t border-glass-border pt-4 text-sm leading-7 text-muted">ورود پیامکی و تأیید مالکیت هنوز برای استفادهٔ عمومی آماده نیستند. معرفی کسب‌وکار، به‌تنهایی مالکیت را تأیید نمی‌کند.</p>
            </aside>
          </section>
          <section className="py-10 sm:py-14" aria-labelledby="owner-loop">
            <div className="mb-7 max-w-2xl">
              <p className="mb-2 text-sm font-semibold text-mint">مسیر محصول</p>
              <h2 id="owner-loop" className="text-2xl font-bold leading-relaxed text-strong sm:text-3xl">شنیدن، فهمیدن، تغییر دادن</h2>
              <p className="mt-3 text-base leading-8 text-muted">تحلیل موضوعات و سنجش تغییر در حال توسعه‌اند. این مسیر با تجربهٔ واقعی و کافی کامل می‌شود؛ برای کسب‌وکاری که هنوز داده ندارد، نتیجه‌ای ساخته نمی‌شود.</p>
            </div>
            <ol className="grid gap-0 border-t border-glass-border sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step.title} className="border-b border-glass-border py-6 sm:pe-6">
                  <span className="mb-4 block text-sm font-semibold text-pomegr" aria-hidden>{(index + 1).toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}</span>
                  <h3 className="text-lg font-bold text-strong">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>
          <section id="verification" className="grid gap-6 border-t border-glass-border pt-9 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16" aria-labelledby="owner-questions">
            <div>
              <h2 id="owner-questions" className="text-2xl font-bold text-strong">پیش از شروع</h2>
              <p className="mt-3 max-w-[36ch] text-sm leading-7 text-muted">تجربهٔ مشتری، صحت اطلاعات و تأیید مالکیت، هرکدام بررسی جداگانه‌ای دارند.</p>
            </div>
            <div className="divide-y divide-glass-border">
              {[
                { question: "برای معرفی کسب‌وکار چه بفرستم؟", answer: "نام، محله یا نشانی و یک راه تماس عمومی. اگر صفحه‌ای در نظراتو داری، لینک آن را هم اضافه کن. برای این معرفی، مدرک هویتی یا اطلاعات خصوصی مشتری لازم نیست." },
                { question: "مالکیت چگونه تأیید می‌شود؟", answer: "پس از آماده‌شدن ورود عمومی، درخواست اتصال صفحه به مالک از مسیر بررسی مدرک انجام می‌شود. داشتن اطلاعات عمومی یا معرفی یک کسب‌وکار، جای بررسی مالکیت را نمی‌گیرد." },
                { question: "تجربهٔ منفی چه می‌شود؟", answer: "منفی‌بودن به‌تنهایی دلیل حذف نیست. تجربه باید به همان کسب‌وکار مربوط باشد؛ گزارش تخلف بررسی می‌شود و در مسیر مالک، امکان پاسخ‌گویی هم در نظر گرفته شده است." },
              ].map(item => (
                <details key={item.question} className="group py-1">
                  <summary className="min-h-12 cursor-pointer py-3 text-base font-semibold leading-7 text-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint">{item.question}</summary>
                  <p className="pb-4 text-sm leading-7 text-muted">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </main>
      </Container>
      <Footer />
    </>
  );
}
