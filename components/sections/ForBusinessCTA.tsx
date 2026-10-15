import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BTN_PRIMARY } from "@/components/ui/styles";
import { ChatBubbleIcon, ShieldCheckIcon, StarIcon } from "@/components/icons";

/**
 * Homepage owner-acquisition section (#27 discoverability). Sits between the
 * IG-shops grid and the blog teaser — late enough that the visitor has seen
 * what the platform looks like, early enough to catch a curious owner before
 * they bounce.
 */
export function ForBusinessCTA() {
  const POINTS = [
    {
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      text: "ادعای مالکیت رایگان است.",
    },
    {
      icon: <ChatBubbleIcon className="w-5 h-5" />,
      text: "به نظرات پاسخ بده و چهره‌ی برندت را بساز.",
    },
    {
      icon: <StarIcon className="w-5 h-5" />,
      text: "اطلاعات و ساعات کاری را خودت مدیریت کن.",
    },
  ];

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] border border-mint/30 bg-[linear-gradient(135deg,rgba(91,230,178,0.10),rgba(63,191,146,0.04)_55%,rgba(123,137,255,0.08))] p-8 sm:p-12 lg:p-14">
          {/* Decorative glow */}
          <div
            className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-mint/20 blur-[90px]"
            aria-hidden
          />
          <div
            className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-lapis/15 blur-[80px]"
            aria-hidden
          />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/[0.08] px-3.5 py-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
                </span>
                <span className="text-[12px] font-bold text-mint tracking-wide">
                  برای صاحبان کسب‌وکار
                </span>
              </div>

              <h2 className="text-[1.6rem] font-black leading-[1.25] text-white sm:text-[2rem] lg:text-[2.4rem]">
                صاحب یک کسب‌وکار هستی؟
                <br />
                <span className="bg-gradient-to-l from-mint to-lapis bg-clip-text text-transparent">
                  صفحه‌ات را در نظراتو در اختیار بگیر.
                </span>
              </h2>

              <p className="mt-4 max-w-[52ch] text-[14px] leading-[2] text-muted sm:text-[16px]">
                وقتی صاحب رسمی به نظرات پاسخ می‌دهد، مشتری‌ها بیشتر اعتماد
                می‌کنند. ادعای مالکیت چند دقیقه طول می‌کشد و تأییدش معمولاً
                ظرف یک روز کاری انجام می‌شود.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/for-business"
                  className={`${BTN_PRIMARY} px-6 py-3 text-[0.92rem]`}
                >
                  ادعای مالکیت کسب‌وکار
                </Link>
                <Link
                  href="/for-business"
                  className="inline-flex items-center justify-center rounded-full border border-glass-border bg-glass px-6 py-3 text-[0.92rem] font-bold text-strong transition-colors duration-200 hover:border-mint/40"
                >
                  بیشتر بدان
                </Link>
              </div>
            </div>

            <ul className="flex flex-col gap-3">
              {POINTS.map((p) => (
                <li
                  key={p.text}
                  className="flex items-center gap-3 rounded-2xl border border-glass-border bg-glass/50 px-4 py-3.5 backdrop-blur-md"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-mint/25 bg-mint/[0.10] text-mint">
                    {p.icon}
                  </span>
                  <span className="text-[0.9rem] leading-[1.7] text-strong">
                    {p.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
