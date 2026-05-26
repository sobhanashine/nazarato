"use client";

/**
 * ReviewSheetAutoOpen — opens the ReviewSheet when the URL carries `?review=1`,
 * then strips the param so a back-button doesn't re-fire it.
 *
 * Mounted on the destinations of the legacy review URLs: home (no prefill),
 * `/company/[slug]` (prefill = the company), `/shop/[handle]` (prefill = the
 * shop). The server `redirect()` from the legacy `/write-review` routes lands
 * here with the param set — the sheet then opens with the business pre-selected
 * when available.
 *
 * Reads `window.location.search` in an effect (not `useSearchParams`) so the
 * host page can still render statically — there's no server-side read to gate.
 */

import { useEffect, useRef } from "react";
import { useReviewSheet } from "./ReviewSheetProvider";
import type { ReviewPrefill } from "./ReviewSheet";

export function ReviewSheetAutoOpen({ prefill }: { prefill?: ReviewPrefill }) {
  const { openReviewSheet } = useReviewSheet();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("review") !== "1") return;
    fired.current = true;

    openReviewSheet(prefill);

    params.delete("review");
    const qs = params.toString();
    const url = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [openReviewSheet, prefill]);

  return null;
}
