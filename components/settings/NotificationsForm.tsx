"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { updateNotificationSettings } from "@/app/(user)/settings/actions";
import { GLASS } from "@/components/ui/styles";

interface NotificationsFormProps {
  initialReplies: boolean;
  initialBookmarks: boolean;
}

export function NotificationsForm({
  initialReplies,
  initialBookmarks,
}: NotificationsFormProps) {
  const [replies, setReplies] = useState(initialReplies);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData();
    if (replies) formData.append("notification_replies", "on");
    if (bookmarks) formData.append("notification_bookmarks", "on");

    startTransition(async () => {
      try {
        const res = await updateNotificationSettings(null, formData);
        if (res.success) {
          toast.success("تنظیمات اعلان‌ها با موفقیت به‌روزرسانی شد.", {
            position: "bottom-center",
            style: {
              background: "#1E293B",
              color: "#FFF",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontFamily: "var(--font-vazirmatn)",
            },
          });
        } else if (res.error) {
          toast.error(res.error, { position: "bottom-center" });
        }
      } catch {
        toast.error("خطایی رخ داد. لطفا دوباره تلاش کنید.", {
          position: "bottom-center",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className={`${GLASS} flex flex-col gap-6 p-5 sm:p-6`}>
      <div className="space-y-6">
        {/* Toggle 1: Replies */}
        <label className="flex cursor-pointer items-start justify-between gap-4 py-1 select-none">
          <div className="flex flex-col gap-1">
            <span className="text-[0.95rem] font-bold text-strong transition-colors hover:text-white">
              پاسخ به نظرات من
            </span>
            <span className="text-[0.8rem] leading-[1.6] text-muted">
              هنگامی که کسب‌وکارها یا سایر کاربران به نظرات شما پاسخ می‌دهند، مطلع شوید.
            </span>
          </div>
          <div className="relative mt-1 shrink-0">
            <input
              type="checkbox"
              name="notification_replies"
              checked={replies}
              onChange={(e) => setReplies(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`h-6 w-11 rounded-full transition-colors duration-200 ${
                replies ? "bg-mint" : "bg-white/10"
              }`}
            />
            <div
              className={`absolute top-1 right-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                replies ? "-translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </label>

        <hr className="border-glass-border" />

        {/* Toggle 2: Bookmarks */}
        <label className="flex cursor-pointer items-start justify-between gap-4 py-1 select-none">
          <div className="flex flex-col gap-1">
            <span className="text-[0.95rem] font-bold text-strong transition-colors hover:text-white">
              تغییرات کسب‌وکارهای نشان‌شده
            </span>
            <span className="text-[0.8rem] leading-[1.6] text-muted">
              دریافت اعلان برای نظرات جدید یا تغییرات کسب‌وکارها و فروشگاه‌هایی که نشان کرده‌اید.
            </span>
          </div>
          <div className="relative mt-1 shrink-0">
            <input
              type="checkbox"
              name="notification_bookmarks"
              checked={bookmarks}
              onChange={(e) => setBookmarks(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`h-6 w-11 rounded-full transition-colors duration-200 ${
                bookmarks ? "bg-mint" : "bg-white/10"
              }`}
            />
            <div
              className={`absolute top-1 right-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                bookmarks ? "-translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-mint px-6 py-3 text-[0.88rem] font-black text-black transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>
    </form>
  );
}
