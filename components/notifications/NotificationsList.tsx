"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import toast from "react-hot-toast";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/(user)/notifications/actions";
import { GLASS } from "@/components/ui/styles";
import type { Notification } from "@/lib/data/notifications";
import { groupByDay } from "./groupByDay";

interface NotificationsListProps {
  items: Notification[];
  /** Reference instant used for «امروز» / «دیروز» day-header math. Passed in
   * by the server page so the first SSR render and the client hydration agree
   * even if the request crosses midnight or server/client clocks differ. */
  now?: number;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return "همین الان";
  if (min < 60) return `${min} دقیقه پیش`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} ساعت پیش`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} روز پیش`;
  return d.toLocaleDateString("fa-IR");
}


function typeAccent(type: Notification["type"]): string {
  switch (type) {
    case "review_approved":
      return "border-emerald-400/30 bg-emerald-400/5";
    case "review_rejected":
      return "border-rose-400/30 bg-rose-400/5";
    case "admin_new_review":
    default:
      return "border-mint/25 bg-mint/5";
  }
}

export function NotificationsList({ items, now }: NotificationsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const hasUnread = items.some((n) => !n.read_at);
  const groups = groupByDay(items, now != null ? new Date(now) : undefined);
  const unreadCount = items.filter((n) => !n.read_at).length;

  function handleClick(n: Notification) {
    if (!n.read_at) {
      startTransition(async () => {
        await markNotificationRead(n.id);
      });
    }
  }

  function handleMarkAll() {
    startTransition(async () => {
      const res = await markAllNotificationsRead();
      if (res.ok) {
        toast.success("همه اعلان‌ها به‌عنوان خوانده‌شده علامت‌گذاری شدند.", {
          position: "bottom-center",
        });
        router.refresh();
      } else if (res.error) {
        toast.error(res.error, { position: "bottom-center" });
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className={`${GLASS} p-8 text-center`}>
        <p className="text-[0.9rem] text-muted">هنوز اعلانی ندارید.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hasUnread && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={isPending}
            className="rounded-lg border border-glass-border bg-glass px-3 py-1.5 text-[0.78rem] font-bold text-muted transition-colors hover:text-strong disabled:opacity-50"
          >
            علامت‌گذاری همه به‌عنوان خوانده‌شده
          </button>
        </div>
      )}

      {/* Visually-hidden live region — `aria-live=polite` on a parent that
          only has aria-label changes doesn't actually fire SR announcements,
          so we render the unread count as TEXT here. After mark-as-read
          revalidates, the new count overwrites this node and the SR speaks
          the update. Confined to in-page updates per #30. */}
      <p aria-live="polite" className="sr-only">
        {unreadCount === 0
          ? "همه اعلان‌ها خوانده شده‌اند."
          : `${unreadCount} اعلان خوانده‌نشده دارید.`}
      </p>

      <section
        aria-label={`${unreadCount} اعلان خوانده‌نشده از ${items.length}`}
        className="flex flex-col gap-6"
      >
        {groups.map((group) => (
          <div key={group.key} className="flex flex-col gap-3">
            <h2 className="text-[0.78rem] font-bold text-muted">
              {group.header}
            </h2>
            <ul className="flex flex-col gap-3">
              {group.items.map((n) => {
                const unread = !n.read_at;
                const cardClass = `${GLASS} ${typeAccent(n.type)} flex items-start gap-3 p-4 transition-colors ${
                  n.link ? "hover:border-mint/45" : ""
                }`;
                const inner = (
                  <>
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        unread ? "bg-mint" : "bg-transparent"
                      }`}
                      aria-hidden
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3
                          className={`text-[0.92rem] ${
                            unread ? "font-black text-strong" : "font-bold text-muted"
                          }`}
                        >
                          {n.title}
                        </h3>
                        <span className="shrink-0 text-[0.72rem] text-muted">
                          {formatWhen(n.created_at)}
                        </span>
                      </div>
                      {n.body && (
                        <p className="text-[0.82rem] leading-[1.7] text-muted">
                          {n.body}
                        </p>
                      )}
                    </div>
                  </>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => handleClick(n)}
                        className={cardClass}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className={cardClass}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
