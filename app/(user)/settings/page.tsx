import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GLASS } from "@/components/ui/styles";
import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/data/users";

export const metadata: Metadata = {
  title: "تنظیمات حساب — نظراتو",
};

function IconBell() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-mint"
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-mint"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

const settingsSections = [
  {
    href: "/settings/notifications",
    title: "اعلان‌های سایت",
    desc: "تنظیمات مربوط به زمان دریافت اعلان‌های درون‌برنامه‌ای، مانند پاسخ دیگران به نظرات شما.",
    icon: <IconBell />,
  },
  {
    href: "/settings/privacy",
    title: "حریم خصوصی حساب",
    desc: "مدیریت نمایش عمومی پروفایل و کنترل دسترسی دیگران به سابقه نظرات شما در نظراتو.",
    icon: <IconLock />,
  },
];

export default async function SettingsIndexPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/settings");

  const user = await getUserById(session.id);
  if (!user) redirect("/login?next=/settings");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[1.25rem] font-black text-strong sm:text-[1.4rem]">
          تنظیمات حساب کاربری
        </h1>
        <p className="mt-1 text-[0.8rem] text-muted">
          اطلاعات و تنظیمات مربوط به اعلان‌ها و حریم خصوصی خود را مدیریت کنید.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className={`${GLASS} group flex flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-mint/35`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint/10 group-hover:bg-mint/15 transition-colors">
                {section.icon}
              </div>
              <h2 className="text-[0.95rem] font-bold text-strong group-hover:text-mint transition-colors">
                {section.title}
              </h2>
            </div>
            <p className="text-[0.8rem] leading-[1.7] text-muted">
              {section.desc}
            </p>
            <div className="mt-auto flex items-center justify-end text-[0.8rem] font-bold text-mint opacity-0 group-hover:opacity-100 transition-opacity">
              <span>ورود به بخش</span>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 me-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
