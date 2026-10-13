"use client";

import { useState } from "react";
import { useReviewSheet } from "@/components/review/ReviewSheetProvider";
import { experienceKey, parseLocalExperience } from "@/lib/preview/golsar";
import { notifyLocalPreviewStorage, useLocalPreviewStorage } from "./useLocalPreviewStorage";

export function LocalExperiencePanel({ slug, name }: { slug: string; name: string }) {
  const { openReviewSheet } = useReviewSheet();
  const raw = useLocalPreviewStorage(experienceKey(slug));
  const saved = parseLocalExperience(raw, slug);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  function remove() {
    try {
      window.localStorage.removeItem(experienceKey(slug));
      notifyLocalPreviewStorage();
      setConfirmDelete(false);
      setError("");
    } catch { setError("حذف انجام نشد؛ دسترسی ذخیره‌سازی مرورگر را بررسی کن."); }
  }
  return (
    <section className="mt-6 border-y border-glass-border py-6" aria-label="تجربهٔ آزمایشی من">
      <h2 className="text-[1.05rem] font-extrabold text-strong">تجربهٔ آزمایشی من</h2>
      <p className="mt-2 text-[14px] leading-7 text-muted">این تجربه فقط در همین مرورگر ذخیره می‌شود و جزو نظرات منتشرشده نیست.</p>
      {saved && <>
        <p className="mt-3 text-sm text-mint">امتیاز من: {saved.rating.toLocaleString("fa-IR")} از ۵</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-strong">{saved.body}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <button type="button" className="inline-flex min-h-11 items-center rounded-lg border border-mint px-3 text-forest hover:bg-mint/5" onClick={() => openReviewSheet({ slug, name })}>ویرایش تجربه</button>
          <button type="button" className="inline-flex min-h-11 items-center px-3 text-muted hover:text-strong" onClick={() => setConfirmDelete(true)}>حذف تجربه</button>
        </div>
      </>}
      {saved && confirmDelete && <div className="mt-4 flex flex-wrap items-center gap-4 text-sm" role="group" aria-label="تأیید حذف تجربه">
        <span>تجربه از این مرورگر حذف شود؟</span>
        <button type="button" className="inline-flex min-h-11 items-center px-3 text-pomegr" onClick={remove}>بله، حذف کن</button>
        <button type="button" className="inline-flex min-h-11 items-center px-3 text-muted" onClick={() => setConfirmDelete(false)}>انصراف</button>
      </div>}
      {error && <p role="alert" className="mt-3 text-sm text-pomegr">{error}</p>}
    </section>
  );
}
