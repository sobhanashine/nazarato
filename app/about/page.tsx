import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { PageBanner } from "@/components/ui/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HeroStats } from "@/components/sections/HeroStats";
import { GLASS, BTN_PRIMARY } from "@/components/ui/styles";
import {
  ChatBubbleIcon,
  PhoneIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "درباره ما – نظراتو",
  description:
    "نظراتو یک پلتفرم مستقل برای نظرات واقعی درباره کسب‌وکارها و فروشگاه‌های ایرانی است. درباره مأموریت، روش تأیید نظرات و سازنده‌اش بخوان.",
};

type Item = { icon: ReactNode; title: string; text: string };

const verifySteps: Item[] = [
  {
    icon: <PhoneIcon />,
    title: "ثبت با حساب واقعی",
    text: "هر نظر به یک شماره موبایل تأییدشده گره خورده؛ حساب‌های یک‌بارمصرف راه ندارن.",
  },
  {
    icon: <SparklesIcon />,
    title: "بررسی خودکار",
    text: "الگوریتم ما اسپم، نظرات تکراری و زبان توهین‌آمیز را پیش از انتشار علامت می‌زنه.",
  },
  {
    icon: <UsersIcon />,
    title: "بازبینی انسانی",
    text: "موارد مشکوک به دست تیم بازبینی می‌رسن — تصمیم نهایی با یک انسانه، نه فقط ماشین.",
  },
  {
    icon: <ChatBubbleIcon />,
    title: "حق پاسخ",
    text: "صاحب هر کسب‌وکار می‌تونه به نظرها پاسخ بده تا گفت‌وگو دوطرفه بمونه.",
  },
];

const values: Item[] = [
  {
    icon: <ShieldCheckIcon />,
    title: "شفافیت",
    text: "نظرات را نمی‌خریم، حذف سفارشی نمی‌کنیم و رتبه‌ها را دستکاری نمی‌کنیم.",
  },
  {
    icon: <ScaleIcon />,
    title: "بی‌طرفی",
    text: "نه طرفِ کاربر، نه طرفِ کسب‌وکار — فقط طرفِ واقعیت می‌ایستیم.",
  },
  {
    icon: <StarIcon />,
    title: "جامعه‌محور",
    text: "نظراتو با تجربهٔ واقعی آدم‌ها ساخته می‌شه و برای همون آدم‌هاست.",
  },
];

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12.5px] font-bold tracking-[0.08em] text-mint mb-2.5">
      {children}
    </p>
  );
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "درباره ما" }]} />
      </Container>
      <PageBanner
        title="درباره نظراتو"
        subtitle="یک پلتفرم مستقل برای نظرات واقعی درباره کسب‌وکارها و فروشگاه‌های ایرانی."
      />

      <Container>
        <main className="pb-20 lg:pb-28">
          {/* ── Mission ── */}
          <section className="mb-14 lg:mb-20">
            <Eyebrow>مأموریت ما</Eyebrow>
            <p className="text-[1.3rem] sm:text-[1.6rem] lg:text-[1.95rem] font-extrabold text-strong leading-[1.6] max-w-[30ch]">
              قبل از هر خرید، یک سؤال ساده در ذهن هست:{" "}
              <span className="bg-[linear-gradient(135deg,#5BE6B2_0%,#7B89FF_100%)] bg-clip-text text-transparent">
                «تجربهٔ بقیه چی بوده؟»
              </span>{" "}
              نظراتو همون جواب را یک‌جا جمع می‌کنه.
            </p>
            <p className="mt-5 text-[15px] text-muted leading-[2] max-w-[62ch]">
              ما یک پلتفرم مستقل نظرات برای کسب‌وکارها و فروشگاه‌های ایرانی هستیم —
              از شرکت‌های بزرگ تا پیج‌های اینستاگرامی. هدفمون اینه که نظرات واقعی و
              بی‌طرف را در دسترس همه بذاریم، بدون فیلترِ تبلیغاتی.
            </p>

            <div className="mt-8 flex justify-center sm:justify-start">
              <HeroStats />
            </div>
          </section>

          {/* ── How we verify reviews ── */}
          <section className="mb-14 lg:mb-20">
            <Eyebrow>اعتماد چطور ساخته می‌شه</Eyebrow>
            <h2 className="text-[1.25rem] sm:text-[1.6rem] font-extrabold text-strong mb-2">
              چطور نظرات را تأیید می‌کنیم
            </h2>
            <p className="text-[14px] text-muted leading-[1.85] max-w-[58ch] mb-7">
              یک نظر فقط وقتی ارزش داره که واقعی باشه. هر نظر پیش از انتشار از این
              چهار مرحله رد می‌شه:
            </p>

            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 list-none">
              {verifySteps.map((step, i) => (
                <li
                  key={step.title}
                  className={`${GLASS} flex flex-col gap-3 p-5 transition-[background,border-color] duration-200 hover:bg-glass-hover hover:border-glass-border-hi`}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-[linear-gradient(135deg,rgba(91,230,178,0.18),rgba(123,137,255,0.18))] border border-glass-border text-mint [&_svg]:w-[20px] [&_svg]:h-[20px]">
                      {step.icon}
                    </span>
                    <span className="tabular-nums text-[2rem] font-extrabold leading-none text-glass-border-hi">
                      {(i + 1).toLocaleString("fa-IR")}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold text-strong">{step.title}</h3>
                  <p className="text-[13px] text-muted leading-[1.9]">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Values ── */}
          <section className="mb-14 lg:mb-20">
            <Eyebrow>چیزی که بهش پایبندیم</Eyebrow>
            <h2 className="text-[1.25rem] sm:text-[1.6rem] font-extrabold text-strong mb-7">
              ارزش‌های ما
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className={`${GLASS} flex flex-col gap-3 p-6 transition-[background,border-color] duration-200 hover:bg-glass-hover hover:border-glass-border-hi`}
                >
                  <span className="grid place-items-center w-12 h-12 rounded-2xl bg-[linear-gradient(135deg,rgba(91,230,178,0.18),rgba(123,137,255,0.18))] border border-glass-border text-mint [&_svg]:w-[24px] [&_svg]:h-[24px]">
                    {v.icon}
                  </span>
                  <h3 className="text-[16px] font-extrabold text-strong">{v.title}</h3>
                  <p className="text-[13.5px] text-muted leading-[1.95]">{v.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Founder note ── */}
          <section className="mb-14 lg:mb-20">
            <div
              className="relative overflow-hidden rounded-[1.25rem] border border-glass-border-hi p-7 sm:p-10 backdrop-blur-[22px] backdrop-saturate-[180%] bg-[rgba(15,20,32,0.55)] bg-[linear-gradient(135deg,rgba(91,230,178,0.10),rgba(123,137,255,0.10))] shadow-[var(--shadow-lg)]"
            >
              <div
                aria-hidden
                className="absolute inset-[-40%] pointer-events-none opacity-80 blur-[44px]"
                style={{
                  background:
                    "radial-gradient(circle at 80% 20%, rgba(123,137,255,0.3), transparent 45%)," +
                    "radial-gradient(circle at 15% 90%, rgba(91,230,178,0.26), transparent 45%)",
                }}
              />
              <div className="relative z-[1]">
                <span
                  aria-hidden
                  className="block text-[3.5rem] leading-[0.4] text-mint/50 font-extrabold mb-4 select-none"
                >
                  «
                </span>
                <Eyebrow>یک یادداشت از بنیان‌گذار</Eyebrow>
                <p className="text-[15px] sm:text-[17px] text-strong/90 leading-[2.1] max-w-[60ch]">
                  نظراتو را یک نفر می‌سازه — من. طراحی، کد، تصمیم‌ها و پاسخ به همین
                  پیام‌ها، همه از یک میز بیرون میاد. این یعنی هیچ لایهٔ شرکتی‌ای بین
                  تو و کسی که محصول را می‌سازه نیست؛ بازخوردت مستقیم به دست
                  تصمیم‌گیرنده می‌رسه و معمولاً همون هفته دیده می‌شه. هدفم ساده‌ست:
                  جایی بسازم که قبل از هر خرید، اولْ سراغش بری.
                </p>
                <div className="flex items-center gap-3 mt-6">
                  <span className="grid place-items-center w-11 h-11 rounded-full bg-[linear-gradient(135deg,#5BE6B2,#7B89FF)] text-[#06231b] font-extrabold shadow-[0_6px_18px_-4px_rgba(91,230,178,0.5)]">
                    س
                  </span>
                  <span>
                    <span className="block text-[14.5px] font-extrabold text-strong">
                      سبحان
                    </span>
                    <span className="block text-[12.5px] text-muted">
                      بنیان‌گذار نظراتو
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className={`${GLASS} text-center p-8 sm:p-12`}>
            <h2 className="text-[1.2rem] sm:text-[1.5rem] font-extrabold text-strong mb-2">
              تجربه‌ات می‌تونه راهنمای یک نفر دیگه باشه
            </h2>
            <p className="text-[14px] text-muted leading-[1.9] max-w-[46ch] mx-auto mb-6">
              چه تجربهٔ خوب، چه بد — نوشتنش چند دقیقه طول می‌کشه و به دیگران کمک می‌کنه
              بهتر انتخاب کنن.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/write-review" className={`${BTN_PRIMARY} py-[0.8rem] px-7 text-[15px]`}>
                نوشتن نظر
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center py-[0.8rem] px-7 text-[15px] font-bold text-strong rounded-full bg-glass border border-glass-border backdrop-blur-[14px] transition-[background,border-color] duration-200 hover:bg-glass-hover hover:border-glass-border-hi"
              >
                مرور دسته‌بندی‌ها
              </Link>
            </div>
          </section>
        </main>
      </Container>
      <Footer />
    </>
  );
}
