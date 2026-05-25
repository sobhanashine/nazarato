import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  ChatBubbleIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "@/components/icons";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "برای کسب‌وکارها – نظراتو",
  description:
    "صفحه‌ی کسب‌وکار خود را در نظراتو ادعا کنید، به نظرات پاسخ دهید و اعتماد مشتری‌ها را به فروش بیشتر تبدیل کنید.",
};

const fa = (n: number) => n.toLocaleString("fa-IR");

const STEPS = [
  {
    n: 1,
    icon: <SparklesIcon className="w-6 h-6" />,
    title: "کسب‌وکار خود را پیدا کن",
    text: "نام برندت رو جستجو کن. اگر صفحه‌ای از قبل ساخته شده، گزینه‌ی «ادعای مالکیت» را بزن.",
  },
  {
    n: 2,
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    title: "هویت خود را تأیید کن",
    text: "با ایمیل کاری روی دامنه‌ی کسب‌وکار یا یک سند رسمی (پروانه، فاکتور، نامه‌ی رسمی) ثابت کن صاحب کسب‌وکار هستی.",
  },
  {
    n: 3,
    icon: <ChatBubbleIcon className="w-6 h-6" />,
    title: "پاسخ بده، اعتماد بساز",
    text: "پس از تأیید، می‌توانی به نظرات پاسخ بدهی، اطلاعات تماس را به‌روز کنی و چهره‌ی برندت را بسازی.",
  },
];

const FEATURES = [
  {
    icon: <StarIcon className="w-6 h-6" />,
    title: "پاسخ عمومی به نظرات",
    text: "هر نظر — مثبت یا منفی — یک فرصت برای نشان دادن پاسخ‌گویی است.",
  },
  {
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    title: "نشان «ثبت‌شده»",
    text: "صفحه‌ی ادعاشده با نشان آبی نشان داده می‌شود تا کاربر بداند صاحبش حضور دارد.",
  },
  {
    icon: <UsersIcon className="w-6 h-6" />,
    title: "اطلاعات قابل ویرایش",
    text: "ساعات کاری، تماس، توضیحات و لوگو را خودت مدیریت کن.",
  },
  {
    icon: <ScaleIcon className="w-6 h-6" />,
    title: "گزارش نظرات نامعتبر",
    text: "اگر نظری ناعادلانه یا جعلی است، با یک کلیک به تیم بازبینی گزارش بده.",
  },
];

const FAQ = [
  {
    q: "ثبت کسب‌وکار رایگان است؟",
    a: "بله. ادعای مالکیت و پاسخ‌گویی به نظرات کاملاً رایگان است. در آینده ابزارهای حرفه‌ای اختیاری (تحلیل، تیم، صفحه‌ی نشان‌دار) ممکن است اشتراکی شوند، اما هسته‌ی محصول رایگان می‌ماند.",
  },
  {
    q: "نظر منفی را می‌توانم پاک کنم؟",
    a: "خیر. ما نظری را به‌خاطر منفی بودن حذف نمی‌کنیم — این پایه‌ی اعتماد در نظراتو است. اما اگر نظری دروغ، توهین‌آمیز یا بی‌ربط است، می‌توانی گزارشش کنی و تیم بازبینی بررسی می‌کند.",
  },
  {
    q: "تأیید مالکیت چقدر طول می‌کشد؟",
    a: "معمولاً بین ۲۴ تا ۷۲ ساعت کاری. بستگی به نوع مدرکی که ارائه می‌کنی و حجم درخواست‌ها دارد.",
  },
  {
    q: "اگر کسب‌وکار من اینجا ثبت نشده باشد چه؟",
    a: "از طریق صفحه‌ی «تماس» با ما در ارتباط باش تا پروفایل کسب‌وکار را برایت بسازیم؛ بعد می‌توانی ادعای مالکیت بدهی.",
  },
];

export default function ForBusinessPage() {
  return (
    <>
      <Header />

      {/* Background atmosphere */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#030706]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-mint/[0.04] blur-[150px]" aria-hidden />
        <div className="absolute top-[30%] right-[-10%] w-[50%] h-[70%] rounded-full bg-lapis/[0.04] blur-[150px]" aria-hidden />
      </div>

      <Container>
        <div className="pt-4">
          <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "برای کسب‌وکارها" }]} />
        </div>

        <main className="pb-24">
          {/* ── Hero ── */}
          <section className="relative pt-12 pb-16 text-center lg:pt-20 lg:pb-24">
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.05] px-5 py-2 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-mint" />
                </span>
                <span className="text-[13px] font-bold text-mint tracking-wide">برای صاحبان کسب‌وکار</span>
              </div>

              <h1 className="text-[2.4rem] font-black leading-[1.15] tracking-tight text-white sm:text-[3.2rem] lg:text-[4rem]">
                نظرات واقعی،
                <br />
                <span className="inline-block bg-gradient-to-l from-mint via-[#a8f0d3] to-lapis bg-clip-text pb-[0.1em] text-transparent">
                  اعتماد بیشتر، فروش بهتر.
                </span>
              </h1>

              <p className="mx-auto mt-7 max-w-[58ch] text-[15px] leading-[2.1] text-muted sm:text-[17px] font-medium">
                صفحه‌ی کسب‌وکار خود را در نظراتو ادعا کن، به نظرات مشتری‌ها پاسخ بده و
                اطلاعات برندت را خودت مدیریت کن. شفافیتی که مشتری‌ها به آن اعتماد می‌کنند.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="/search?q="
                  className={`${BTN_PRIMARY} px-7 py-3.5 text-[0.95rem]`}
                >
                  ادعای مالکیت کسب‌وکار
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-glass-border bg-glass px-7 py-3.5 text-[0.95rem] font-bold text-strong transition-colors duration-200 hover:border-mint/40"
                >
                  ثبت کسب‌وکار جدید
                </Link>
              </div>
            </div>
          </section>

          {/* ── How it works ── */}
          <section className="py-14 lg:py-20">
            <div className="mb-12 text-center">
              <h2 className="text-[1.75rem] font-black text-white sm:text-[2.2rem]">
                در ۳ گام، صفحه‌ات را در اختیار بگیر
              </h2>
              <p className="mx-auto mt-3 max-w-[48ch] text-[15px] leading-[2] text-muted">
                از ادعای مالکیت تا اولین پاسخ به نظر، کمتر از یک ساعت کار می‌برد.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className={`${GLASS} relative overflow-hidden p-7 transition-all duration-300 hover:-translate-y-1 hover:border-mint/30`}
                >
                  <span
                    aria-hidden
                    className="absolute -right-3 -top-6 text-[6rem] font-black leading-none text-white/[0.04] select-none"
                  >
                    {fa(s.n)}
                  </span>
                  <div className="relative z-10">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-mint/20 bg-mint/[0.08] text-mint">
                      {s.icon}
                    </div>
                    <h3 className="mb-3 text-[1.05rem] font-black text-strong">{s.title}</h3>
                    <p className="text-[0.9rem] leading-[1.9] text-muted">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Features ── */}
          <section className="py-14 lg:py-20">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-[1.75rem] font-black text-white sm:text-[2.2rem]">
                  چه چیزی به‌دست می‌آوری
                </h2>
                <p className="mt-3 max-w-[48ch] text-[15px] leading-[2] text-muted">
                  پس از تأیید مالکیت، ابزارهایی برای ساختن یک رابطه‌ی واقعی با مشتری‌ها.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={`${GLASS} flex gap-4 p-6 transition-colors duration-300 hover:border-mint/30`}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-mint/20 bg-mint/[0.08] text-mint">
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[0.98rem] font-black text-strong">{f.title}</h3>
                    <p className="mt-1.5 text-[0.88rem] leading-[1.9] text-muted">{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="py-14 lg:py-20">
            <div className="mb-10 text-center">
              <h2 className="text-[1.75rem] font-black text-white sm:text-[2.2rem]">
                سوال‌های پرتکرار
              </h2>
            </div>

            <div className="mx-auto max-w-[760px] flex flex-col gap-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className={`${GLASS} group p-5 transition-colors duration-300 hover:border-mint/25`}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.95rem] font-bold text-strong">
                    {item.q}
                    <span
                      aria-hidden
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-glass-border bg-glass text-mint transition-transform duration-300 group-open:rotate-45"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-4 text-[0.88rem] leading-[2] text-muted">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="py-14 lg:py-20">
            <div className="relative mx-auto max-w-[900px] overflow-hidden rounded-[2rem] border border-mint/30 bg-[linear-gradient(135deg,rgba(91,230,178,0.08),rgba(63,191,146,0.04))] p-10 text-center sm:p-14">
              <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-mint/15 blur-[80px]" aria-hidden />
              <div className="relative z-10">
                <h2 className="text-[1.6rem] font-black text-white sm:text-[2rem]">
                  آماده‌ی شروعی؟
                </h2>
                <p className="mx-auto mt-4 max-w-[50ch] text-[14px] leading-[2] text-muted sm:text-[16px]">
                  نام کسب‌وکارت را جستجو کن، صفحه‌اش را پیدا کن و ادعای مالکیت بده. تأیید معمولاً
                  در کمتر از یک روز کاری انجام می‌شود.
                </p>
                <Link
                  href="/search?q="
                  className={`${BTN_PRIMARY} mt-7 px-7 py-3.5 text-[0.95rem]`}
                >
                  جستجوی کسب‌وکار
                </Link>
              </div>
            </div>
          </section>
        </main>
      </Container>
      <Footer />
    </>
  );
}
