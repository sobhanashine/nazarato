import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NotificationsForm } from "@/components/settings/NotificationsForm";
import { PushToggle } from "@/components/settings/PushToggle";
import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/data/users";

export const metadata: Metadata = {
  title: "تنظیمات اعلان‌ها — نظراتو",
};

export default async function NotificationsSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/settings/notifications");

  const user = await getUserById(session.id);
  if (!user) redirect("/login?next=/settings/notifications");

  return (
    <div className="flex flex-col gap-5">
      {/* Back link */}
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-[0.8rem] text-muted hover:text-mint transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span>بازگشت به تنظیمات</span>
        </Link>
      </div>

      <div>
        <h1 className="text-[1.25rem] font-black text-strong sm:text-[1.4rem]">
          اعلان‌های سایت
        </h1>
        <p className="mt-1 text-[0.8rem] text-muted">
          مشخص کنید چه زمان‌هایی مایل به دریافت اعلان در پنل کاربری خود هستید.
        </p>
      </div>

      <NotificationsForm
        initialReplies={user.notification_replies ?? true}
        initialBookmarks={user.notification_bookmarks ?? true}
      />

      <PushToggle vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
    </div>
  );
}
