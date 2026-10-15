"use client";

/**
 * ReviewSheetProvider — app-wide controller for the bottom-sheet review wizard.
 *
 * Mounted once in the root layout. Exposes `openReviewSheet()` via context so
 * any client component (the mobile tab-bar FAB, a company page CTA, …) can
 * launch the wizard. Reopening restores that business's unsent draft from
 * provider memory. Reloading the page clears these drafts; no new storage or
 * public submission path is introduced.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { Business } from "@/lib/data/businesses";
import { ReviewSheet, type LocalReviewPreview, type ReviewDraft, type ReviewPrefill } from "./ReviewSheet";
import { experienceKey, parseLocalExperience, submitLocalPreviewReview } from "@/lib/preview/golsar";
import { notifyLocalPreviewStorage } from "@/components/preview/useLocalPreviewStorage";

type ReviewSheetContextValue = {
  /** Open the review sheet; pass a business to skip the picker step. */
  openReviewSheet: (prefill?: ReviewPrefill) => void;
};

const ReviewSheetContext = createContext<ReviewSheetContextValue | null>(null);

export function useReviewSheet(): ReviewSheetContextValue {
  const ctx = useContext(ReviewSheetContext);
  if (!ctx) {
    throw new Error("useReviewSheet must be used inside <ReviewSheetProvider>");
  }
  return ctx;
}

export function ReviewSheetProvider({
  children,
  businesses,
  localPreview = false,
}: {
  children: React.ReactNode;
  businesses: Business[];
  localPreview?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<ReviewPrefill | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const [initialValue, setInitialValue] = useState<LocalReviewPreview["initialValue"]>();
  const [initialDraft, setInitialDraft] = useState<ReviewDraft>();
  const drafts = useRef(new Map<string, ReviewDraft>());
  const lastDraftSlug = useRef<string | null>(null);

  const rememberDraft = useCallback((draft: ReviewDraft) => {
    drafts.current.set(draft.business.slug, draft);
    lastDraftSlug.current = draft.business.slug;
  }, []);

  const clearDraft = useCallback((slug: string) => {
    drafts.current.delete(slug);
    if (lastDraftSlug.current === slug) lastDraftSlug.current = null;
  }, []);

  const getDraft = useCallback((slug: string) => drafts.current.get(slug), []);

  const submitLocal: LocalReviewPreview["submit"] = async (_previous, formData) => {
    const slug = formData.get("slug");
    if (typeof slug !== "string" || !businesses.some(b => b.slug === slug)) {
      return { ok: false, error: "کافهٔ انتخاب‌شده در این فهرست نیست." };
    }
    try {
      const result = submitLocalPreviewReview(window.localStorage, slug, formData);
      if (result.ok) notifyLocalPreviewStorage();
      return result;
    } catch {
      return { ok: false, error: "دسترسی به ذخیره‌سازی مرورگر ممکن نیست؛ متن تو هنوز اینجاست." };
    }
  };

  const openReviewSheet = useCallback((p?: ReviewPrefill) => {
    const draft = drafts.current.get(p?.slug ?? lastDraftSlug.current ?? "");
    const resumable = draft && (p || businesses.some(b => b.slug === draft.business.slug))
      ? draft
      : undefined;
    const target = p ?? resumable?.business ?? null;
    let saved: LocalReviewPreview["initialValue"];
    if (localPreview && target && businesses.some(b => b.slug === target.slug)) {
      try { saved = parseLocalExperience(window.localStorage.getItem(experienceKey(target.slug)), target.slug) ?? undefined; }
      catch { /* The form still opens when browser storage is unavailable. */ }
    }
    setInitialValue(saved);
    setInitialDraft(resumable);
    setPrefill(target);
    setSessionKey((n) => n + 1);
    setIsOpen(true);
  }, [businesses, localPreview]);

  const close = useCallback(() => setIsOpen(false), []);

  // A navigation (e.g. the login link) should never leave the sheet hanging
  // over the next page.
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    setIsOpen(false);
  }, [pathname]);

  return (
    <ReviewSheetContext.Provider value={{ openReviewSheet }}>
      {children}
      {sessionKey > 0 && (
        <ReviewSheet
          key={sessionKey}
          isOpen={isOpen}
          onClose={close}
          prefill={prefill}
          businesses={businesses}
          localPreview={localPreview ? { initialValue, submit: submitLocal } : undefined}
          initialDraft={initialDraft}
          onDraftChange={rememberDraft}
          onDraftClear={clearDraft}
          getDraft={getDraft}
        />
      )}
    </ReviewSheetContext.Provider>
  );
}
