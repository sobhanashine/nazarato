import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  ChatBubbleIcon,
  PhoneIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "@/components/icons";
import { AboutWriteReview } from "@/components/sections/AboutWriteReview";

export const metadata: Metadata = {
  title: "درباره ما – نظراتو",
  description:
    "نظراتو یک پلتفرم مستقل برای نظرات واقعی درباره کسب‌وکارها و فروشگاه‌های ایرانی است. درباره مأموریت، روش تأیید نظرات و سازنده‌اش بخوان.",
};

const fa = (n: number) => n.toLocaleString("fa-IR");

type Accent = "mint" | "lapis" | "saffron";

const TONE: Record<Accent, { text: string; border: string; glow: string; grad: string; iconBg: string }> = {
  mint: { text: "text-mint", border: "border-mint/20", glow: "bg-mint/20", grad: "from-mint/[0.15]", iconBg: "bg-mint/[0.08]" },
  lapis: { text: "text-lapis", border: "border-lapis/20", glow: "bg-lapis/20", grad: "from-lapis/[0.15]", iconBg: "bg-lapis/[0.08]" },
  saffron: { text: "text-saffron", border: "border-saffron/20", glow: "bg-saffron/20", grad: "from-saffron/[0.15]", iconBg: "bg-saffron/[0.08]" },
};

const stats = [
  { value: 12428, suffix: "+", label: "نظر ثبت‌شده", tone: "mint" as const, desc: "تجربه‌های تأییدشده توسط کاربران واقعی" },
  { value: 3420, suffix: "+", label: "کسب‌وکار", tone: "lapis" as const, desc: "تحت پوشش و بررسی مداوم" },
  { value: 98, suffix: "٪", label: "رضایت کاربران", tone: "saffron" as const, desc: "از شفافیت و بی‌طرفی پلتفرم" },
];

const verifySteps = [
  {
    icon: <PhoneIcon className="w-8 h-8" />,
    title: "ثبت با حساب واقعی",
    text: "هر نظر به یک شماره موبایل تأییدشده گره خورده؛ حساب‌های یک‌بارمصرف و ربات‌ها در سیستم ما جایی ندارند.",
  },
  {
    icon: <SparklesIcon className="w-8 h-8" />,
    title: "بررسی هوشمند",
    text: "الگوریتم اختصاصی ما الگوهای مشکوک، اسپم، نظرات تکراری و کلمات نامناسب را در صدم ثانیه شناسایی می‌کند.",
  },
  {
    icon: <UsersIcon className="w-8 h-8" />,
    title: "بازبینی انسانی",
    text: "هیچ سیستمی کامل نیست. موارد خط‌قرمزدار و مشکوک مستقیماً روی میز تیم بازبینی ما قرار می‌گیرند تا یک انسان تصمیم نهایی را بگیرد.",
  },
  {
    icon: <ChatBubbleIcon className="w-8 h-8" />,
    title: "حق پاسخ‌گویی",
    text: "ما صدای هر دو طرفیم. صاحب هر کسب‌وکار این حق را دارد که به نظرات پاسخ دهد تا شفافیت و گفت‌وگو دوطرفه بماند.",
  },
];

const values = [
  {
    icon: <ShieldCheckIcon className="w-7 h-7" />,
    title: "شفافیت مطلق",
    text: "نظرات را نمی‌خریم و رتبه‌ها را دستکاری نمی‌کنیم. ما هیچ پولی برای تغییر نظر از هیچ کسب‌وکارهایی دریافت نمی‌کنیم. آنچه می‌بینی، دقیقاً همان چیزی است که رخ داده.",
    tone: "mint" as const,
  },
  {
    icon: <ScaleIcon className="w-7 h-7" />,
    title: "بی‌طرفی کامل",
    text: "نه طرف کاربریم، نه طرف کسب‌وکار. تنها معیار ما برای انتشار، صحت داده‌ها و تجربه‌های تأییدشده است. قضاوت نهایی با شماست.",
    tone: "lapis" as const,
  },
  {
    icon: <StarIcon className="w-7 h-7" />,
    title: "جامعه‌محوری",
    text: "اینجا فضایی است که با تجربه واقعی آدم‌ها، برای محافظت از سرمایه و وقت همان آدم‌ها ساخته می‌شود. ما تنها یک بستر امن ساخته‌ایم.",
    tone: "saffron" as const,
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      
      {/* ── Background Atmosphere ── */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#030706]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-mint/[0.04] blur-[150px]" aria-hidden />
        <div className="absolute top-[30%] right-[-10%] w-[50%] h-[70%] rounded-full bg-lapis/[0.04] blur-[150px]" aria-hidden />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-mint/[0.03] blur-[120px]" aria-hidden />
        
        {/* Subtle noise texture */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.015] mix-blend-overlay">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      <Container>
        <div className="pt-4">
          <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "درباره ما" }]} />
        </div>

        <main className="pb-24">
          {/* ── Hero Section ── */}
          <section className="relative pt-16 pb-24 text-center lg:pt-28 lg:pb-32">
            <span 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-[15vw] font-black tracking-tighter uppercase whitespace-nowrap select-none pointer-events-none text-white/[0.02]"
              aria-hidden
            >
              NAZARATO
            </span>

            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.05] px-5 py-2 backdrop-blur-md transition-colors hover:bg-mint/[0.08] hover:border-mint/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-mint"></span>
                </span>
                <span className="text-[14px] font-bold text-mint tracking-wide">مانیفست ما</span>
              </div>

              <h1 className="text-[3.5rem] font-black leading-[1.1] tracking-tight text-white sm:text-[4.5rem] lg:text-[6rem]">
                حقیقت محض،
                <br />
                <span className="inline-block bg-gradient-to-l from-mint via-[#a8f0d3] to-lapis bg-clip-text pb-[0.1em] text-transparent drop-shadow-sm">
                  بدون فیلتر.
                </span>
              </h1>

              <p className="mx-auto mt-8 max-w-[60ch] text-[17px] leading-[2.2] text-muted sm:text-[20px] font-medium">
                در فضایی که هر چیزی قابل خریدن است، ما یک پایگاه مستقل برای تجربه‌های
                واقعی ساخته‌ایم. نظراتو تنها راهی تازه برای اعتماد نیست؛ نقطه‌ی پایان فریب است.
              </p>
            </div>
          </section>

          {/* ── Bento Stats ── */}
          <section className="my-10 lg:my-20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
              {/* Primary Stat */}
              <div className="col-span-1 md:col-span-8 group relative overflow-hidden rounded-[2rem] border border-glass-border bg-glass p-8 md:p-12 backdrop-blur-xl transition-all duration-500 hover:border-mint/30">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-mint/[0.08] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-mint/10 blur-[80px] transition-transform duration-700 group-hover:scale-150 group-hover:bg-mint/20" aria-hidden />
                
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <div className="mb-2 text-[16px] font-bold text-mint tracking-wider">{stats[0].label}</div>
                    <div className="text-[15px] font-medium text-muted max-w-[200px] leading-relaxed">{stats[0].desc}</div>
                  </div>
                  <div className="mt-12 flex items-baseline gap-1">
                    <span className="text-[4rem] font-black leading-none text-white md:text-[6rem] lg:text-[8rem] tracking-tighter">
                      {fa(stats[0].value)}
                    </span>
                    <span className="text-[2rem] font-black text-mint md:text-[3rem]">
                      {stats[0].suffix}
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Stats */}
              <div className="col-span-1 md:col-span-4 flex flex-col gap-5 md:gap-6">
                {stats.slice(1).map((s) => (
                  <div key={s.label} className="group relative flex-1 overflow-hidden rounded-[2rem] border border-glass-border bg-glass p-8 backdrop-blur-xl transition-all duration-500 hover:border-glass-border-hi">
                    <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-br ${TONE[s.tone].grad} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                    <div className={`absolute -bottom-12 -left-12 h-32 w-32 rounded-full ${TONE[s.tone].glow} blur-[50px] transition-transform duration-700 group-hover:scale-150`} aria-hidden />
                    
                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div>
                        <div className={`mb-1 text-[15px] font-bold ${TONE[s.tone].text} tracking-wider`}>{s.label}</div>
                        <div className="text-[14px] font-medium text-muted">{s.desc}</div>
                      </div>
                      <div className="mt-8 flex items-baseline gap-1">
                        <span className="text-[3rem] font-black leading-none text-white md:text-[3.5rem] tracking-tighter">
                          {fa(s.value)}
                        </span>
                        <span className={`text-[1.5rem] font-black ${TONE[s.tone].text}`}>
                          {s.suffix}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Values (Bento style) ── */}
          <section className="py-24 lg:py-32">
            <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-[2rem] font-black text-white sm:text-[2.5rem] lg:text-[3rem] leading-tight">
                  خط قرمزهای ما
                </h2>
                <p className="mt-4 max-w-[48ch] text-[16px] leading-[2] text-muted sm:text-[18px]">
                  این اصول برای ما صرفاً شعار نیستند؛ بلکه کدهایی هستند که پلتفرم نظراتو روی آن‌ها بنا شده است.
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="group relative overflow-hidden rounded-3xl border border-glass-border bg-glass p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-glass-border-hi"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${TONE[v.tone].grad} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-50`} aria-hidden />
                  
                  <div className="relative z-10">
                    <div className={`mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl border ${TONE[v.tone].border} ${TONE[v.tone].iconBg} ${TONE[v.tone].text} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      {v.icon}
                    </div>
                    <h3 className="mb-4 text-[22px] font-black text-white tracking-tight">{v.title}</h3>
                    <p className="text-[16px] leading-[2.1] text-muted font-medium">{v.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Timeline / Verification ── */}
          <section className="py-24 lg:py-32 relative">
            <div className="mb-20 text-center">
              <h2 className="text-[2rem] font-black text-white sm:text-[2.5rem] lg:text-[3rem]">
                معماری یک نظر واقعی
              </h2>
              <p className="mx-auto mt-6 max-w-[54ch] text-[16px] leading-[2] text-muted sm:text-[18px]">
                نظرات در پلتفرم ما به سادگی منتشر نمی‌شوند. هر کلمه پیش از آنکه روی صفحه قرار بگیرد،
                از یک مسیر سختگیرانه عبور می‌کند.
              </p>
            </div>

            <div className="relative mx-auto max-w-4xl">
              {/* Central Line */}
              <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-px -translate-x-1/2 bg-gradient-to-b from-mint/50 via-lapis/50 to-transparent" />

              <div className="space-y-12 md:space-y-24">
                {verifySteps.map((step, i) => {
                  const isEven = i % 2 === 0;
                  return (
                    <div key={step.title} className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                      
                      {/* Node point */}
                      <div className="absolute left-8 md:left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-4 border-[#030706] bg-mint shadow-[0_0_20px_rgba(91,230,178,0.4)] z-10" aria-hidden>
                        <div className="h-2 w-2 rounded-full bg-[#030706]" />
                      </div>

                      {/* Content Card */}
                      <div className={`w-full md:w-1/2 pl-20 md:pl-0 ${isEven ? 'md:text-left md:pr-16' : 'md:text-right md:pl-16'}`}>
                        <div className="group relative overflow-hidden rounded-3xl border border-glass-border bg-glass p-8 backdrop-blur-xl transition-all duration-300 hover:border-mint/30 hover:bg-glass-hover shadow-lg">
                          <span className="absolute -right-4 -top-8 text-[8rem] font-black leading-none text-white/[0.03] select-none pointer-events-none transition-transform duration-500 group-hover:-translate-y-4" aria-hidden>
                            ۰{fa(i + 1)}
                          </span>
                          
                          <div className="relative z-10">
                            <div className={`mb-6 inline-flex p-3 rounded-xl border border-mint/20 bg-mint/[0.08] text-mint ${isEven ? 'md:ml-auto' : ''}`}>
                              {step.icon}
                            </div>
                            <h3 className="mb-4 text-[22px] font-black text-white">{step.title}</h3>
                            <p className="text-[16px] leading-[2] text-muted">{step.text}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Editorial Founder Note ── */}
          <section className="py-24 lg:py-32">
            <div className="relative mx-auto max-w-[1000px] overflow-hidden rounded-[2.5rem] border border-glass-border bg-[#050b09] p-10 sm:p-16 lg:p-20 shadow-2xl">
              {/* Editorial Ornaments */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-mint to-transparent opacity-50" />
              <div className="absolute -top-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-mint/5 blur-[120px] pointer-events-none" aria-hidden />
              
              <div className="relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start">
                
                <div className="flex-1 space-y-8">
                  <div className="flex items-center gap-4">
                    <span className="h-px w-12 bg-mint/50" />
                    <span className="text-[15px] font-bold tracking-widest text-mint uppercase">Founders Note</span>
                  </div>
                  
                  <h2 className="text-[2.25rem] font-black leading-[1.3] text-white sm:text-[2.75rem]">
                    چرا همه‌چیز را فدای <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint to-lapis">حقیقت</span> کردیم؟
                  </h2>
                  
                  <div className="space-y-6 text-[17px] leading-[2.2] text-muted sm:text-[19px]">
                    <p>
                      نظراتو یک استارتاپ پر زرق‌وبرق با تزریق‌های مالی میلیاردی نیست. ما اینجا جمع نشدیم تا به کسب‌وکارها پکیج‌های «بهبود رتبه» بفروشیم. این پروژه دقیقاً از دل یک ناامیدی بزرگ متولد شد: <strong className="font-bold text-white">گم شدن صدای واقعی مردم زیر آوار تبلیغات.</strong>
                    </p>
                    <p>
                      وقتی می‌خواهیم خرید کنیم یا خدماتی بگیریم، حق مسلم ماست که بدانیم دیگران قبل از ما چه بهایی داده‌اند. پنهان کردن نظرات منفی و خریدن لایک، دزدی از جیب کاربر بعدی است. من نظراتو را ساختم تا پایگاهی غیرقابل‌نفوذ باشد؛ جایی که داده‌ها متعلق به خود مردم است، نه ویترین کسب‌وکارها.
                    </p>
                  </div>
                </div>

                <div className="w-full lg:w-[300px] shrink-0 border-t border-glass-border pt-10 lg:border-t-0 lg:border-r lg:pt-0 lg:pr-12">
                  <div className="flex flex-col items-center lg:items-start text-center lg:text-right gap-6">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-mint to-lapis text-[2.5rem] font-black text-[#020806] shadow-lg transform rotate-3 transition-transform hover:rotate-0 duration-300">
                      س
                      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 ring-inset" />
                    </div>
                    <div>
                      <div className="text-[22px] font-black text-white tracking-tight">سبحان</div>
                      <div className="mt-1 text-[15px] font-semibold tracking-wide text-mint">طراح و بنیان‌گذار</div>
                    </div>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted/80">
                      «هیچ برندی آنقدر بزرگ نیست که بالاتر از حقیقت بایستد.»
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ── Bold CTA ── */}
          <section className="pb-10 pt-10 lg:pb-20">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-glass-border bg-glass px-8 py-20 text-center backdrop-blur-xl sm:px-16 sm:py-24">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(91,230,178,0.15),transparent_70%)]" aria-hidden />
              
              <div className="relative z-10 flex flex-col items-center">
                <h2 className="text-[2.5rem] font-black leading-[1.2] text-white sm:text-[3.5rem] lg:text-[4rem] tracking-tight">
                  جامعه به صدای شما <br className="hidden sm:block" /> نیاز دارد.
                </h2>
                <p className="mx-auto mt-6 mb-10 max-w-[50ch] text-[17px] leading-[2] text-muted sm:text-[19px]">
                  سکوت شما مساوی است با تکرار یک تجربه بد برای نفر بعدی.
                  هر نظر، چه مثبت و چه منفی، آجری از بنای اعتماد است.
                </p>
                
                <AboutWriteReview />
              </div>
            </div>
          </section>

        </main>
      </Container>
      <Footer />
    </>
  );
}
