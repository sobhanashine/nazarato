"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { updatePrivacySettings } from "@/app/(user)/settings/actions";
import { GLASS } from "@/components/ui/styles";

interface PrivacyFormProps {
  initialPublicProfile: boolean;
}

export function PrivacyForm({ initialPublicProfile }: PrivacyFormProps) {
  const [publicProfile, setPublicProfile] = useState(initialPublicProfile);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData();
    if (publicProfile) formData.append("public_profile", "on");

    startTransition(async () => {
      try {
        const res = await updatePrivacySettings(null, formData);
        if (res.success) {
          toast.success("تنظیمات حریم خصوصی با موفقیت به‌روزرسانی شد.", {
            position: "bottom-center",
            style: {
              background: "#FFFDFA",
              color: "#1F3029",
              border: "1px solid #DDDCD2",
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
        {/* Toggle: Public Profile */}
        <label className="flex cursor-pointer items-start justify-between gap-4 py-1 select-none">
          <div className="flex flex-col gap-1">
            <span className="text-[0.95rem] font-bold text-strong transition-colors hover:text-forest">
              نمایش عمومی پروفایل کاربری
            </span>
            <span className="text-[0.8rem] leading-[1.6] text-muted">
              اجازه دهید دیگران بتوانند صفحه پروفایل عمومی و لیست نظرات منتشرشده شما را مشاهده کنند.
            </span>
          </div>
          <div className="relative mt-1 shrink-0">
            <input
              type="checkbox"
              name="public_profile"
              checked={publicProfile}
              onChange={(e) => setPublicProfile(e.target.checked)}
              className="sr-only peer"
            />
            <div
              className={`h-6 w-11 rounded-lg transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-mint peer-focus-visible:ring-offset-2 ${
                publicProfile ? "bg-mint" : "bg-line"
              }`}
            />
            <div
              className={`absolute top-1 right-1 h-4 w-4 rounded-lg bg-white  transition-transform duration-200 ${
                publicProfile ? "-translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </label>

        {/* Informational Warning Block */}
        {!publicProfile && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-[0.8rem] leading-[1.6] text-saffron">
            <svg
              viewBox="0 0 24 24"
              className="mt-0.5 h-5 w-5 shrink-0 text-saffron"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="font-bold text-saffron">پروفایل شما غیرفعال و خصوصی می‌شود</p>
              <p className="mt-0.5 text-muted">
                با غیرفعال کردن این گزینه، کاربران دیگر با مراجعه به آدرس پروفایل عمومی شما با خطای ۴۰۴ مواجه خواهند شد و سابقه نظرات شما مخفی می‌ماند.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 min-w-11 group relative flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-6 py-3 text-[0.88rem] font-bold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>
    </form>
  );
}
