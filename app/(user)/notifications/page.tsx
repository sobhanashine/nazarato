import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { getSession } from "@/lib/auth/session";
import { listUserNotifications } from "@/lib/data/notifications";

export const metadata: Metadata = {
  title: "اعلان‌ها — نظراتو",
};

export const dynamic = "force-dynamic";

/**
 * `/notifications` (#30) — activity feed under the `(user)` route group.
 *
 * Lives at the top-level `/notifications` per the issue contract. The legacy
 * `/profile/notifications` path now redirects here so push-notification deep
 * links and existing bookmarks don't 404.
 */
export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/notifications");

  const items = await listUserNotifications(session.id);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[1.25rem] font-black text-strong sm:text-[1.4rem]">
          اعلان‌ها
        </h1>
        <p className="mt-1 text-[0.8rem] text-muted">
          آخرین رویدادهای حساب شما، شامل وضعیت نظرات و فعالیت‌های مدیریتی.
        </p>
      </div>

      <NotificationsList items={items} />
    </div>
  );
}
