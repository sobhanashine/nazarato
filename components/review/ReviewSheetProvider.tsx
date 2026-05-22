"use client";

/**
 * ReviewSheetProvider — app-wide controller for the bottom-sheet review wizard.
 *
 * Mounted once in the root layout. Exposes `openReviewSheet()` via context so
 * any client component (the mobile tab-bar FAB, a company page CTA, …) can
 * launch the wizard. Each open bumps a key so a fresh `<ReviewSheet>` mounts —
 * wizard + server-action state always start clean, and the enter animation
 * replays every time.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { Business } from "@/lib/data/businesses";
import { ReviewSheet, type ReviewPrefill } from "./ReviewSheet";

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
}: {
  children: React.ReactNode;
  businesses: Business[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<ReviewPrefill | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const pathname = usePathname();

  const openReviewSheet = useCallback((p?: ReviewPrefill) => {
    setPrefill(p ?? null);
    setSessionKey((n) => n + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  // A navigation (e.g. the login link) should never leave the sheet hanging
  // over the next page.
  useEffect(() => {
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
        />
      )}
    </ReviewSheetContext.Provider>
  );
}
