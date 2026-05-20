import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { PageBanner } from "@/components/ui/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ContactForm } from "@/components/contact/ContactForm";
import { GLASS } from "@/components/ui/styles";
import {
  ChatBubbleIcon,
  ClockIcon,
  InstagramIcon,
  MailIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "تماس با ما – نظراتو",
  description:
    "با تیم نظراتو در تماس باش — سوال، پیشنهاد، گزارش یک نظر یا درخواست همکاری.",
};

type Channel = {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
  hint: string;
};

const channels: Channel[] = [
  {
    icon: <MailIcon />,
    label: "ایمیل",
    value: "info@nazarato.ir",
    href: "mailto:info@nazarato.ir",
    hint: "برای پیگیری‌های رسمی و همکاری",
  },
  {
    icon: <InstagramIcon />,
    label: "اینستاگرام",
    value: "@nazarato",
    href: "https://instagram.com/nazarato",
    hint: "سریع‌ترین راه برای گفت‌وگوی کوتاه",
  },
  {
    icon: <ClockIcon />,
    label: "ساعات پاسخ‌گویی",
    value: "شنبه تا چهارشنبه · ۹ تا ۱۷",
    hint: "پاسخ پیام‌ها معمولاً ظرف ۱ تا ۲ روز کاری",
  },
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "تماس با ما" }]} />
      </Container>
      <PageBanner
        title="تماس با ما"
        subtitle="سوال، پیشنهاد، گزارش یک نظر یا همکاری — هر چی باشه، خوشحال می‌شیم بشنویم."
      />

      <Container>
        <div className="flex flex-col gap-8 mb-16 lg:flex-row lg:items-start lg:gap-12 lg:mb-24">
          {/* ── Form ── */}
          <main className="w-full lg:w-[58%]">
            <div className={`${GLASS} p-6 sm:p-8`}>
              <h1 className="text-[1.25rem] sm:text-[1.45rem] font-extrabold text-strong mb-1.5">
                برامون پیام بفرست
              </h1>
              <p className="text-[13.5px] text-muted leading-[1.8] mb-6">
                فرم زیر را پر کن؛ پیامت مستقیم به دست تیم نظراتو می‌رسه.
              </p>
              <ContactForm />
            </div>
          </main>

          {/* ── Channels ── */}
          <aside className="w-full lg:w-[42%] flex flex-col gap-4">
            <h2 className="text-[1.05rem] font-extrabold text-strong px-1">
              راه‌های دیگر ارتباط
            </h2>

            {channels.map((c) => {
              const inner = (
                <>
                  <span className="grid place-items-center w-11 h-11 shrink-0 rounded-xl bg-[linear-gradient(135deg,rgba(91,230,178,0.18),rgba(123,137,255,0.18))] border border-glass-border text-mint [&_svg]:w-[22px] [&_svg]:h-[22px]">
                    {c.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] text-muted">{c.label}</span>
                    <span
                      className="block text-[15px] font-bold text-strong truncate"
                      dir={c.label === "ایمیل" || c.label === "اینستاگرام" ? "ltr" : "rtl"}
                      style={
                        c.label === "ایمیل" || c.label === "اینستاگرام"
                          ? { textAlign: "right" }
                          : undefined
                      }
                    >
                      {c.value}
                    </span>
                    <span className="block text-[12px] text-muted mt-1 leading-[1.6]">
                      {c.hint}
                    </span>
                  </span>
                </>
              );

              return c.href ? (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`${GLASS} flex items-start gap-3.5 p-4 transition-[background,border-color,transform] duration-200 hover:bg-glass-hover hover:border-glass-border-hi hover:-translate-y-[2px]`}
                >
                  {inner}
                </a>
              ) : (
                <div key={c.label} className={`${GLASS} flex items-start gap-3.5 p-4`}>
                  {inner}
                </div>
              );
            })}

            {/* Reassurance note */}
            <div className="flex items-start gap-3 rounded-glass border border-mint/20 bg-mint/[0.06] p-4">
              <span className="text-mint shrink-0 mt-0.5 [&_svg]:w-[20px] [&_svg]:h-[20px]">
                <ChatBubbleIcon />
              </span>
              <p className="text-[12.5px] text-strong/85 leading-[1.85]">
                می‌خوای یک نظر را گزارش کنی؟ موضوع پیامت را «گزارش نظر» بذار و لینک
                صفحه را برامون بفرست تا سریع‌تر بررسی بشه.
              </p>
            </div>
          </aside>
        </div>
      </Container>
      <Footer />
    </>
  );
}
