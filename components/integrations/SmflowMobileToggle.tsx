"use client";

import { useEffect, useState } from "react";

/**
 * Mobile-only edge handle that reveals/hides the SMFlow chat FAB.
 *
 * Why: on phones the always-visible FAB collides with the <MobileTabBar />
 * (or just feels noisy). We hide it by default via CSS (`body:not([data-smflow-open])`)
 * and show this small chevron tab on the right edge. Tapping it flips the
 * `data-smflow-open` attribute on <body>, which our globals.css watches to
 * toggle the FAB's visibility. Desktop keeps the FAB always-on — the
 * component itself is `md:hidden`.
 */
export function SmflowMobileToggle() {
  const [open, setOpen] = useState(false);

  // Mirror state to <body> so the CSS selectors in globals.css can react.
  useEffect(() => {
    if (open) document.body.setAttribute("data-smflow-open", "true");
    else document.body.removeAttribute("data-smflow-open");
    return () => document.body.removeAttribute("data-smflow-open");
  }, [open]);

  return (
    // Pin to the same bottom offset as the FAB so they sit at the same height.
    // FAB has bottom: calc(100px + safe-area), height 64px; toggle is 56px,
    // so +4px nudge centers them. z-index is high enough to stay above the
    // SMFlow chat panel when opened (chat widgets typically use very large
    // z-index values) so the toggle remains tappable to close.
    <button
      type="button"
      aria-label={open ? "بستن دستیار هوشمند" : "باز کردن دستیار هوشمند"}
      aria-expanded={open}
      aria-controls="smflow-widget-container"
      onClick={() => setOpen((v) => !v)}
      style={{ bottom: "calc(104px + env(safe-area-inset-bottom))" }}
      className="md:hidden fixed right-0 z-[2147483646] w-7 h-14 grid place-items-center rounded-l-xl bg-[rgba(10,13,22,0.85)] backdrop-blur-md border border-glass-border border-r-0 text-mint shadow-[0_8px_24px_rgba(0,0,0,0.4)] active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint focus-visible:outline-offset-2"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
      >
        {/* Chevron pointing left in document order — towards the page center,
            which in our RTL layout reads as "open the side panel". */}
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}
