import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ContactForm } from "@/components/contact/ContactForm";
import { ChatBubbleIcon, ClockIcon, InstagramIcon, MailIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "تماس با ما – نظراتو",
  description:
    "با تیم نظراتو در تماس باش — سوال، پیشنهاد، گزارش یک نظر یا درخواست همکاری.",
};

type Accent = "mint" | "lapis" | "saffron";

/** Full literal class strings per accent — keeps the Tailwind scanner happy. */
const TONE: Record<Accent, { text: string; ring: string; glow: string }> = {
  mint: { text: "text-mint", ring: "border-mint/25", glow: "bg-mint/15" },
  lapis: { text: "text-lapis", ring: "border-lapis/25", glow: "bg-lapis/15" },
  saffron: { text: "text-saffron", ring: "border-saffron/25", glow: "bg-saffron/15" },
};

type Channel = {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
  ltr?: boolean;
  tone: Accent;
};

const channels: Channel[] = [
  {
    icon: <MailIcon className="w-6 h-6" />,
    label: "ارتباط مستقیم",
    value: "info@nazarato.ir",
    href: "mailto:info@nazarato.ir",
    ltr: true,
    tone: "mint",
  },
  {
    icon: <InstagramIcon className="w-5 h-5" />,
    label: "شبکه اجتماعی",
    value: "@nazarato",
    href: "https://instagram.com/nazarato",
    ltr: true,
    tone: "lapis",
  },
  {
    icon: <ClockIcon className="w-6 h-6" />,
    label: "ساعت پاسخ‌گویی",
    value: "شنبه تا چهارشنبه · ۹ تا ۱۷",
    tone: "saffron",
  },
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "تماس با ما" }]} />

        <main className="pb-16 lg:pb-24">
          {/* ── Hero ── */}
          <section className="pt-10 pb-12 text-center lg:pt-14">
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-mint/25 bg-mint/[0.07] px-4 py-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden />
              <span className="text-[13px] font-bold text-mint">پشتیبانی و ارتباط</span>
            </div>
            <h1 className="text-[2.25rem] font-black leading-[1.2] tracking-tight text-white sm:text-[3rem]">
              با ما در تماس باش
            </h1>
            <p className="mx-auto mt-5 max-w-[50ch] text-[15px] leading-[1.95] text-muted sm:text-[17px]">
              سوال، پیشنهاد، گزارش یک نظر یا درخواست همکاری — پیامت را همین‌جا
              بفرست، زود جواب می‌دهیم.
            </p>
          </section>

          {/* ── Form + channels ── */}
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
            {/* Form */}
            <div className="rounded-[1.75rem] border border-glass-border bg-glass p-6 backdrop-blur-xl sm:p-9">
              <h2 className="mb-1 text-[1.25rem] font-black text-white">فرم تماس</h2>
              <p className="mb-7 text-[14px] text-muted">
                همه‌ی فیلدها جز موضوع الزامی هستند.
              </p>
              <ContactForm />
            </div>

            {/* Channels */}
            <aside className="flex flex-col gap-4">
              {channels.map((c) => {
                const content = (
                  <div className="relative flex items-start gap-4 overflow-hidden rounded-2xl border border-glass-border bg-glass p-5 backdrop-blur-xl transition-all duration-300 hover:border-glass-border-hi hover:bg-glass-hover">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-black/40 ${TONE[c.tone].ring} ${TONE[c.tone].text}`}
                    >
                      {c.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="mb-1 block text-[13px] font-semibold text-muted">
                        {c.label}
                      </span>
                      <span
                        className="block truncate text-[15px] font-bold text-white"
                        dir={c.ltr ? "ltr" : "rtl"}
                      >
                        {c.value}
                      </span>
                    </div>
                  </div>
                );

                return c.href ? (
                  <a
                    key={c.label}
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="block"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={c.label}>{content}</div>
                );
              })}

              {/* Reporting note */}
              <div className="relative flex items-start gap-4 rounded-2xl border border-pomegr/20 bg-pomegr/[0.04] p-5 backdrop-blur-xl">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pomegr/10 text-pomegr">
                  <ChatBubbleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="mb-1.5 text-[14px] font-black text-white">
                    گزارش نقض قوانین
                  </h3>
                  <p className="text-[13px] leading-[1.9] text-muted">
                    برای گزارش یک نظر خاص، شناسه یا لینک مستقیم آن صفحه را در متن
                    پیام بنویس.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </Container>
      <Footer />
    </>
  );
}
