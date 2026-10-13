"use client";

import { useEffect, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "nazarato:install-dismissed-until";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SHOW_DELAY_MS = 4000;

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports itself as Mac; detect via touch points.
  const isIPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isAppleMobile || isIPadOS;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // Safari-specific
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function dismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  const until = Number(localStorage.getItem(DISMISS_KEY) || "0");
  return Number.isFinite(until) && until > Date.now();
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  // Detected once at mount via a lazy initializer — `isIOS()` is SSR-safe and the
  // value never changes, so no effect/setState is needed.
  const [ios] = useState(isIOS);
  const [iosSheetOpen, setIosSheetOpen] = useState(false);
  const iosDialogRef = useRef<HTMLDialogElement>(null);
  const [deferred, setDeferred] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || dismissedRecently()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      if (dismissedRecently()) return;
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari never fires beforeinstallprompt — surface the banner ourselves.
    const t = ios
      ? window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
      : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (t) window.clearTimeout(t);
    };
  }, [ios]);

  useEffect(() => {
    const dialog = iosDialogRef.current;
    if (!dialog) return;
    if (!iosSheetOpen) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [iosSheetOpen, visible]);

  const dismiss = () => {
    setVisible(false);
    setIosSheetOpen(false);
    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + DISMISS_COOLDOWN_MS),
      );
    } catch {
      // localStorage unavailable (private mode) — ignore.
    }
  };

  const handleInstall = async () => {
    if (ios) {
      setIosSheetOpen(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setDeferred(null);
  };

  if (!visible) return null;

  return (
    <>
      <section aria-live="polite" aria-label="پیشنهاد افزودن نظراتو به صفحه اصلی"
        className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+80px)] z-[300] rounded-lg border border-glass-border-hi bg-paper p-4 md:inset-x-auto md:bottom-6 md:end-6 md:w-[360px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[16px] font-bold leading-7 text-strong">نظراتو در صفحهٔ اصلی گوشی</p>
            <p className="mt-1 text-[13px] leading-6 text-muted">یک میانبر برای برگشتن به مکان‌ها و تجربه‌ها.</p>
          </div>
          <button type="button" onClick={dismiss} aria-label="بستن پیشنهاد نصب" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-strong">
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <button type="button" onClick={handleInstall} className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-forest px-4 text-[14px] font-semibold text-white hover:opacity-90">
          {ios ? "راهنمای افزودن میانبر" : "افزودن به صفحهٔ اصلی"}
        </button>
      </section>
      <dialog ref={iosDialogRef} aria-labelledby="ios-install-title" onCancel={() => setIosSheetOpen(false)} onClose={() => setIosSheetOpen(false)}
        className="fixed inset-x-0 bottom-0 top-auto m-0 h-fit max-h-[90dvh] w-full max-w-none overflow-y-auto border-0 border-t border-glass-border-hi bg-paper p-0 text-strong backdrop:bg-black/30 md:inset-0 md:m-auto md:max-w-[420px] md:rounded-lg md:border">
        <div className="px-6 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3">
            <h2 id="ios-install-title" className="text-[20px] font-bold leading-8 text-strong">افزودن به صفحهٔ اصلی</h2>
            <button type="button" aria-label="بستن راهنما" onClick={() => setIosSheetOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-canvas"><span aria-hidden className="text-[24px]">×</span></button>
          </div>
          <p className="mt-2 text-[14px] leading-7 text-muted">در سافاری، نظراتو را به صفحهٔ اصلی گوشی اضافه کن.</p>
          <ol className="mt-5 list-inside list-decimal space-y-4 text-[14px] leading-7 text-strong">
            <li>دکمهٔ اشتراک‌گذاری سافاری را باز کن.</li>
            <li>گزینهٔ «افزودن به صفحهٔ اصلی» را انتخاب کن.</li>
            <li>روی «افزودن» بزن.</li>
          </ol>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button type="button" onClick={dismiss} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-glass-border px-3 text-[14px] font-semibold text-strong hover:bg-canvas">فعلاً نه</button>
            <button type="button" onClick={() => setIosSheetOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-forest px-3 text-[14px] font-semibold text-white hover:opacity-90">متوجه شدم</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
