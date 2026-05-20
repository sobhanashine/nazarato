import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BTN_PRIMARY } from "@/components/ui/styles";
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

const fa = (n: number) => n.toLocaleString("fa-IR");

type Accent = "mint" | "lapis" | "saffron";

/** Full literal class strings per accent — keeps the Tailwind scanner happy. */
const TONE: Record<Accent, { text: string; ring: string; glow: string; grad: string }> = {
  mint: { text: "text-mint", ring: "border-mint/25", glow: "bg-mint/15", grad: "from-mint/[0.12]" },
  lapis: { text: "text-lapis", ring: "border-lapis/25", glow: "bg-lapis/15", grad: "from-lapis/[0.12]" },
  saffron: { text: "text-saffron", ring: "border-saffron/25", glow: "bg-saffron/15", grad: "from-saffron/[0.12]" },
};

const CARD =
  "rounded-3xl border border-glass-border bg-glass backdrop-blur-xl transition-all duration-300";

const stats: { value: number; suffix: string; label: string; tone: Accent }[] = [
  { value: 12428, suffix: "+", label: "نظر ثبت‌شده", tone: "mint" },
  { value: 3420, suffix: "+", label: "کسب‌وکار", tone: "lapis" },
  { value: 98, suffix: "٪", label: "رضایت کاربران", tone: "saffron" },
];

const verifySteps = [
  {
    icon: <PhoneIcon className="w-7 h-7" />,
    title: "ثبت با حساب واقعی",
    text: "هر نظر به یک شماره موبایل تأییدشده گره خورده؛ حساب‌های یک‌بارمصرف راه ندارن.",
  },
  {
    icon: <SparklesIcon className="w-7 h-7" />,
    title: "بررسی خودکار",
    text: "الگوریتم ما اسپم، نظرات تکراری و زبان توهین‌آمیز را پیش از انتشار علامت می‌زنه.",
  },
  {
    icon: <UsersIcon className="w-7 h-7" />,
    title: "بازبینی انسانی",
    text: "موارد مشکوک به دست تیم بازبینی می‌رسن — تصمیم نهایی با یک انسانه، نه فقط ماشین.",
  },
  {
    icon: <ChatBubbleIcon className="w-7 h-7" />,
    title: "حق پاسخ",
    text: "صاحب هر کسب‌وکار می‌تونه به نظرها پاسخ بده تا گفت‌وگو دوطرفه بمونه.",
  },
];

const values: { icon: React.ReactNode; title: string; text: string; tone: Accent }[] = [
  {
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    title: "شفافیت",
    text: "نظرات را نمی‌خریم و رتبه‌ها را دستکاری نمی‌کنیم. هر چیزی که می‌بینی، واقعی است.",
    tone: "mint",
  },
  {
    icon: <ScaleIcon className="w-6 h-6" />,
    title: "بی‌طرفی",
    text: "نه طرف کاربر، نه طرف کسب‌وکار. فقط داده‌های واقعی و تجربه‌های تأییدشده.",
    tone: "lapis",
  },
  {
    icon: <StarIcon className="w-6 h-6" />,
    title: "جامعه‌محوری",
    text: "یک فضای مستقل که با تجربه واقعی آدم‌ها، برای همان آدم‌ها ساخته می‌شود.",
    tone: "saffron",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "درباره ما" }]} />

        <main className="pb-8">
          {/* ── Hero ── */}
          <section className="pt-10 pb-14 text-center lg:pt-16 lg:pb-20">
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-mint/25 bg-mint/[0.07] px-4 py-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden />
              <span className="text-[13px] font-bold text-mint">درباره نظراتو</span>
            </div>

            <h1 className="text-[2.5rem] font-black leading-[1.2] tracking-tight text-white sm:text-[3.5rem] lg:text-[4.25rem]">
              حقیقت محض،
              <br />
              <span className="inline-block bg-gradient-to-l from-mint to-lapis bg-clip-text pb-[0.12em] text-transparent">
                بدون فیلتر.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-[52ch] text-[16px] leading-[2] text-muted sm:text-[18px]">
              در فضایی که هر چیزی قابل خریدن است، ما یک پایگاه مستقل برای تجربه‌های
              واقعی ساخته‌ایم. نظراتو راهی تازه برای اعتماد است.
            </p>
          </section>

          {/* ── Stats ── */}
          <section className="grid gap-4 sm:grid-cols-3 sm:gap-5">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`${CARD} relative overflow-hidden p-7 text-center hover:border-glass-border-hi hover:bg-glass-hover`}
              >
                <div
                  className={`absolute -top-14 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full ${TONE[s.tone].glow} opacity-60 blur-3xl`}
                  aria-hidden
                />
                <div className="relative">
                  <div className="flex items-end justify-center gap-1 leading-none">
                    <span className="text-[2.75rem] font-black text-white sm:text-[3rem]">
                      {fa(s.value)}
                    </span>
                    <span className={`pb-1.5 text-[1.5rem] font-black ${TONE[s.tone].text}`}>
                      {s.suffix}
                    </span>
                  </div>
                  <div className="mt-3 text-[14px] font-semibold text-muted">{s.label}</div>
                </div>
              </div>
            ))}
          </section>

          {/* ── How verification works ── */}
          <section className="py-20 lg:py-28">
            <div className="mb-12 text-center lg:mb-16">
              <h2 className="text-[1.85rem] font-black text-white sm:text-[2.25rem]">
                چطور نظرها را تأیید می‌کنیم؟
              </h2>
              <p className="mx-auto mt-4 max-w-[52ch] text-[15px] leading-[1.95] text-muted sm:text-[16px]">
                هر نظر پیش از انتشار از یک فیلتر چهارمرحله‌ای عبور می‌کند تا فقط
                تجربه‌های واقعی منتشر شوند.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
              {verifySteps.map((step, i) => (
                <div
                  key={step.title}
                  className={`${CARD} relative overflow-hidden p-7 hover:border-mint/30 hover:bg-glass-hover sm:p-8`}
                >
                  <span
                    className="pointer-events-none absolute top-5 left-7 select-none text-[3.5rem] font-black leading-none text-white/[0.05]"
                    aria-hidden
                  >
                    ۰{fa(i + 1)}
                  </span>
                  <div className="relative">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-mint/20 bg-mint/[0.08] text-mint">
                      {step.icon}
                    </div>
                    <h3 className="mb-3 text-[18px] font-black text-white">{step.title}</h3>
                    <p className="text-[15px] leading-[1.95] text-muted">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Values ── */}
          <section className="-mx-5 border-y border-glass-border bg-black/20 px-5 py-20 sm:-mx-6 sm:px-6 lg:-mx-12 lg:px-12 lg:py-24 xl:-mx-16 xl:px-16">
            <h2 className="mb-12 text-center text-[1.85rem] font-black text-white sm:text-[2.25rem] lg:mb-16">
              ارزش‌های ما
            </h2>
            <div className="grid gap-5 sm:grid-cols-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className={`${CARD} group relative overflow-hidden p-7 hover:border-glass-border-hi`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-b ${TONE[v.tone].grad} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                    aria-hidden
                  />
                  <div className="relative">
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border bg-black/40 ${TONE[v.tone].ring} ${TONE[v.tone].text}`}
                    >
                      {v.icon}
                    </div>
                    <h3 className="mb-2.5 text-[17px] font-black text-white">{v.title}</h3>
                    <p className="text-[14px] leading-[1.95] text-muted">{v.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Founder note ── */}
          <section className="py-20 lg:py-28">
            <div
              className={`${CARD} relative mx-auto max-w-[820px] overflow-hidden p-8 sm:p-12`}
            >
              <div
                className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-mint/10 blur-3xl"
                aria-hidden
              />
              <div
                className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-lapis/10 blur-3xl"
                aria-hidden
              />
              <div className="relative">
                <span className="text-[14px] font-bold text-mint">یادداشت بنیان‌گذار</span>
                <h2 className="mt-3 mb-7 text-[1.6rem] font-black text-white sm:text-[2rem]">
                  چرا نظراتو را ساختم؟
                </h2>
                <div className="space-y-5 text-[16px] leading-[2.1] text-muted sm:text-[17px]">
                  <p>
                    نظراتو یک استارتاپ بزرگ با سرمایه‌گذار نیست. یک پروژه‌ی مستقل است
                    که برای حل یک مشکل ساده ساخته شد:{" "}
                    <strong className="font-bold text-white">
                      نبودِ نظرهای واقعی و بدون دستکاری
                    </strong>{" "}
                    درباره‌ی کسب‌وکارهای ایرانی.
                  </p>
                  <p>
                    وقتی خریدی می‌کنیم، حق داریم بدانیم دیگران چه تجربه‌ای داشته‌اند.
                    اما خیلی از پلتفرم‌ها نظرهای منفی را پنهان می‌کنند. نظراتو را ساختم
                    تا یک فضای بی‌طرف بماند؛ جایی که داده‌ها متعلق به خود مردم است.
                  </p>
                </div>
                <div className="mt-9 flex items-center gap-4 border-t border-glass-border pt-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-mint to-lapis text-[18px] font-black text-black">
                    س
                  </div>
                  <div>
                    <div className="text-[15px] font-black text-white">سبحان</div>
                    <div className="text-[13px] font-semibold text-muted">بنیان‌گذار نظراتو</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="pb-4 text-center">
            <h2 className="text-[1.85rem] font-black text-white sm:text-[2.25rem]">
              تجربه‌ات را ثبت کن
            </h2>
            <p className="mx-auto mt-4 mb-8 max-w-[46ch] text-[15px] leading-[1.95] text-muted sm:text-[16px]">
              هر نظر — چه مثبت، چه منفی — به یک نفر دیگر کمک می‌کند انتخاب بهتری
              داشته باشد.
            </p>
            <Link href="/write-review" className={`${BTN_PRIMARY} px-9 py-3.5 text-[16px]`}>
              ثبت نظر
            </Link>
          </section>
        </main>
      </Container>
      <Footer />
    </>
  );
}
