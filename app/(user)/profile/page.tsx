import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GLASS } from "@/components/ui/styles";
import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/data/users";

export const metadata: Metadata = {
  title: "پروفایل من — نظراتو",
};

const faNum = (n: number) => n.toLocaleString("fa-IR");

/** Default avatar tint when the account has no `avatar_color` set. */
const FALLBACK_COLOR = "#5BBB7B";

const quickLinks = [
  {
    href: "/profile/reviews",
    title: "نظرات من",
    desc: "نظرهایی که نوشتی و وضعیت انتشارشان",
  },
  {
    href: "/saved",
    title: "ذخیره‌شده‌ها",
    desc: "کسب‌وکارها و فروشگاه‌هایی که نشان کردی",
  },
  {
    href: "/settings",
    title: "تنظیمات",
    desc: "حساب، امنیت و حریم خصوصی",
  },
];

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/profile");

  // The session is signed but the row could have been removed since — treat a
  // missing row as a stale session and send the user back through login.
  const user = await getUserById(session.id);
  if (!user) redirect("/login?next=/profile");

  const initial = user.display_name.trim().charAt(0) || "؟";
  // Build "<month> <year>" explicitly — the fa-IR default orders it year-first.
  const joined = new Date(user.created_at);
  const memberSince = `${joined.toLocaleDateString("fa-IR", {
    month: "long",
  })} ${joined.toLocaleDateString("fa-IR", { year: "numeric" })}`;

  const stats = [
    { key: "reviews", label: "نظرات", value: user.reviews_count ?? 0 },
    { key: "helpful", label: "مفید بود", value: user.helpful_votes_received ?? 0 },
    { key: "reputation", label: "امتیاز اعتبار", value: user.reputation_score ?? 0 },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="sr-only">پروفایل من</h1>

      {/* Identity card */}
      <section className={`${GLASS} flex items-center gap-4 p-5 sm:p-6`}>
        <div
          className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full text-2xl font-black text-white shadow-[0_6px_18px_-4px_rgba(0,0,0,0.5)] sm:h-20 sm:w-20"
          style={{ background: user.avatar_color ?? FALLBACK_COLOR }}
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-[1.15rem] font-black text-strong sm:text-[1.3rem]">
              {user.display_name}
            </h2>
            {user.role === "admin" && (
              <span className="inline-flex items-center rounded-full bg-rose-500/15 px-2 py-0.5 text-[0.7rem] font-bold text-rose-400 border border-rose-500/30">
                مدیر سیستم
              </span>
            )}
          </div>
          <p className="mt-1 text-[0.8rem] text-muted">عضو از {memberSince}</p>
          {user.username && (
            <p className="mt-0.5 text-[0.8rem] text-mint">@{user.username}</p>
          )}
        </div>
      </section>

      {/* Stats */}
      <section
        className="grid grid-cols-3 gap-3"
        aria-label="آمار فعالیت"
      >
        {stats.map((s) => (
          <div
            key={s.key}
            className={`${GLASS} flex flex-col items-center gap-1 p-4 text-center`}
          >
            <span className="text-[1.4rem] font-black tabular-nums text-strong sm:text-[1.7rem]">
              {faNum(s.value)}
            </span>
            <span className="text-[0.75rem] text-muted sm:text-[0.8rem]">
              {s.label}
            </span>
          </div>
        ))}
      </section>

      {/* Quick links */}
      <section className="grid gap-3 sm:grid-cols-3" aria-label="بخش‌های حساب">
        {(() => {
          const links = [...quickLinks];
          if (user.role === "admin") {
            links.push({
              href: "/admin/moderation",
              title: "پنل مدیریت",
              desc: "بررسی، تایید و مدیریت نظرات کاربران",
            });
          }
          return links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${GLASS} group flex flex-col gap-1.5 p-4 transition-colors duration-200 hover:border-mint/40`}
            >
              <span className="flex items-center justify-between gap-2 text-[0.95rem] font-bold text-strong">
                {link.title}
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-mint"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {/* RTL: chevron points left toward the destination */}
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </span>
              <span className="text-[0.8rem] leading-[1.7] text-muted">
                {link.desc}
              </span>
            </Link>
          ));
        })()}
      </section>
    </div>
  );
}
