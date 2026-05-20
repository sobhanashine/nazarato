import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { PageBanner } from "@/components/ui/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
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

/** Persian-digit number formatter — deterministic on server & client. */
const fa = (n: number) => n.toLocaleString("fa-IR");

type Accent = "mint" | "lapis" | "saffron";

const accent: Record<Accent, { chip: string; line: string; bar: string }> = {
  mint: {
    chip: "bg-mint/12 border-mint/30 text-mint",
    line: "from-mint",
    bar: "bg-mint",
  },
  lapis: {
    chip: "bg-lapis/12 border-lapis/30 text-lapis",
    line: "from-lapis",
    bar: "bg-lapis",
  },
  saffron: {
    chip: "bg-saffron/12 border-saffron/30 text-saffron",
    line: "from-saffron",
    bar: "bg-saffron",
  },
};

type Stat = { value: number; suffix?: string; label: string; tone: Accent };

const stats: Stat[] = [
  { value: 12428, label: "نظر تأییدشده", tone: "mint" },
  { value: 3420, label: "کسب‌وکار ثبت‌شده", tone: "lapis" },
  { value: 98, suffix: "٪", label: "رضایت کاربران", tone: "saffron" },
];

type Step = { icon: ReactNode; title: string; text: string };

const verifySteps: Step[] = [
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

type Value = { icon: ReactNode; title: string; text: string; tone: Accent };

const values: Value[] = [
  {
    icon: <ShieldCheckIcon />,
    title: "شفافیت",
    text: "نظرات را نمی‌خریم، حذف سفارشی نمی‌کنیم و رتبه‌ها را دستکاری نمی‌کنیم.",
    tone: "mint",
  },
  {
    icon: <ScaleIcon />,
    title: "بی‌طرفی",
    text: "نه طرفِ کاربر، نه طرفِ کسب‌وکار — فقط طرفِ واقعیت می‌ایستیم.",
    tone: "lapis",
  },
  {
    icon: <StarIcon />,
    title: "جامعه‌محور",
    text: "نظراتو با تجربهٔ واقعی آدم‌ها ساخته می‌شه و برای همون آدم‌هاست.",
    tone: "saffron",
  },
];

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.08em] text-mint mb-3">
      <span aria-hidden className="w-5 h-px bg-mint/60" />
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
          {/* ── Mission — asymmetric: statement beside live stats ── */}
          <section className="mb-16 lg:mb-24 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12 lg:items-center">
            <div>
              <Eyebrow>مأموریت ما</Eyebrow>
              <h1 className="text-[1.5rem] sm:text-[1.95rem] lg:text-[2.3rem] font-extrabold text-strong leading-[1.55]">
                قبل از هر خرید یک سؤال ساده در ذهن هست:{" "}
                <span className="bg-[linear-gradient(135deg,#5BE6B2_0%,#7B89FF_100%)] bg-clip-text text-transparent">
                  «تجربهٔ بقیه چی بوده؟»
                </span>
              </h1>
              <p className="mt-5 text-[15px] text-muted leading-[2.05] max-w-[60ch]">
                نظراتو همون جواب را یک‌جا جمع می‌کنه. ما یک پلتفرم مستقل نظرات برای
                کسب‌وکارها و فروشگاه‌های ایرانی هستیم — از شرکت‌های بزرگ تا پیج‌های
                اینستاگرامی. هدفمون اینه که نظرات واقعی و بی‌طرف را در دسترس همه بذاریم،
                بدون فیلترِ تبلیغاتی.
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 list-none">
              {stats.map((s) => (
                <li
                  key={s.label}
                  className={`${GLASS} relative overflow-hidden flex flex-col gap-1 px-5 py-4`}
                >
                  <span
                    aria-hidden
                    className={`absolute inset-y-0 right-0 w-[3px] ${accent[s.tone].bar}`}
                  />
                  <span className="tabular-nums [font-feature-settings:'ss01'] text-[1.75rem] font-extrabold text-strong leading-none -tracking-[0.01em]">
                    {fa(s.value)}
                    {s.suffix ?? ""}
                  </span>
                  <span className="text-[12.5px] text-muted">{s.label}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── How we verify reviews — connected timeline ── */}
          <section className="mb-16 lg:mb-24">
            <div className="mb-9">
              <Eyebrow>اعتماد چطور ساخته می‌شه</Eyebrow>
              <h2 className="text-[1.35rem] sm:text-[1.7rem] font-extrabold text-strong">
                مسیر تأیید هر نظر
              </h2>
              <p className="mt-2.5 text-[14px] text-muted leading-[1.95] max-w-[58ch]">
                یک نظر فقط وقتی ارزش داره که واقعی باشه. هر نظر پیش از انتشار از این
                چهار مرحله رد می‌شه:
              </p>
            </div>

            <ol className="relative list-none">
              {verifySteps.map((step, i) => {
                const isLast = i === verifySteps.length - 1;
                return (
                  <li
                    key={step.title}
                    className="relative grid grid-cols-[3rem_1fr] gap-x-5 pb-5 last:pb-0"
                  >
                    {!isLast && (
                      <span
                        aria-hidden
                        className="absolute right-6 top-12 bottom-0 w-px bg-gradient-to-b from-glass-border-hi to-glass-border"
                      />
                    )}
                    <span className="relative z-[1] self-start grid place-items-center w-12 h-12 rounded-full bg-[linear-gradient(135deg,#5BE6B2,#7B89FF)] text-[#06231b] font-extrabold text-[1.05rem] tabular-nums shadow-[0_6px_18px_-6px_rgba(91,230,178,0.65)]">
                      {fa(i + 1)}
                    </span>
                    <div
                      className={`${GLASS} p-5 transition-[background,border-color] duration-200 hover:bg-glass-hover hover:border-glass-border-hi`}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-mint [&_svg]:w-[18px] [&_svg]:h-[18px]">
                          {step.icon}
                        </span>
                        <h3 className="text-[15px] font-bold text-strong">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-[13px] text-muted leading-[1.95]">
                        {step.text}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ── Values — accent-coded cards ── */}
          <section className="mb-16 lg:mb-24">
            <div className="mb-9">
              <Eyebrow>چیزی که بهش پایبندیم</Eyebrow>
              <h2 className="text-[1.35rem] sm:text-[1.7rem] font-extrabold text-strong">
                ارزش‌های ما
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className={`${GLASS} relative overflow-hidden flex flex-col gap-3.5 p-6 transition-[background,border-color,transform] duration-200 hover:bg-glass-hover hover:border-glass-border-hi hover:-translate-y-0.5`}
                >
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 top-0 h-px bg-gradient-to-l ${accent[v.tone].line} to-transparent`}
                  />
                  <span
                    className={`grid place-items-center w-12 h-12 rounded-2xl border ${accent[v.tone].chip} [&_svg]:w-[24px] [&_svg]:h-[24px]`}
                  >
                    {v.icon}
                  </span>
                  <h3 className="text-[16px] font-extrabold text-strong">
                    {v.title}
                  </h3>
                  <p className="text-[13.5px] text-muted leading-[1.95]">
                    {v.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Founder note ── */}
          <section className="mb-16 lg:mb-24">
            <div className="relative overflow-hidden rounded-[1.25rem] border border-glass-border-hi p-7 sm:p-10 backdrop-blur-[22px] backdrop-saturate-[180%] bg-[rgba(15,20,32,0.55)] bg-[linear-gradient(135deg,rgba(91,230,178,0.10),rgba(123,137,255,0.10))] shadow-[var(--shadow-lg)]">
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
                  نظراتو را یک نفر می‌سازه — من. طراحی، کد, تصمیم‌ها و پاسخ به همین
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
