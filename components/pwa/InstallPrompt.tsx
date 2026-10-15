"use client";

import { useEffect, useState } from "react";

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
      <div
        role="dialog"
        aria-live="polite"
        aria-label="پیشنهاد افزودن نظراتو به صفحه اصلی"
        className="fixed inset-x-3 z-[300] bottom-[calc(env(safe-area-inset-bottom)+88px)] md:bottom-6 md:left-auto md:right-6 md:w-[360px] flex items-center gap-3 p-3 pr-4 rounded-2xl bg-[rgba(10,13,22,0.92)] backdrop-blur-[24px] backdrop-saturate-[180%] border border-glass-border-hi shadow-[0_-8px_30px_rgba(0,0,0,0.55),0_0_0_1px_rgba(91,230,178,0.08),inset_0_1px_0_rgba(255,255,255,0.08)] animate-[pwa-slide-up_280ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
      >
        <span className="shrink-0 inline-flex w-11 h-11 items-center justify-center rounded-xl bg-[#0a0e18] border border-glass-border shadow-[0_4px_14px_rgba(91,230,178,0.18)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt=""
            width={32}
            height={32}
            className="w-8 h-8"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-strong leading-[1.35]">
            نظراتو رو نصب کن
          </p>
          <p className="text-[12px] text-muted leading-[1.55] truncate">
            دسترسی سریع‌تر، بدون باز کردن مرورگر.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex items-center justify-center h-9 px-3.5 rounded-full text-[12.5px] font-semibold text-[#06231b] bg-[linear-gradient(135deg,#5BE6B2_0%,#7B89FF_100%)] shadow-[0_4px_14px_rgba(91,230,178,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] transition-transform duration-150 active:scale-[0.97]"
          >
            {ios ? "راهنما" : "نصب"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="بستن"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-muted hover:text-strong hover:bg-glass-hover transition-colors duration-150"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </div>

      {iosSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-[400] flex items-end md:items-center justify-center"
        >
          <button
            type="button"
            aria-label="بستن راهنما"
            onClick={() => setIosSheetOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-[6px]"
          />
          <div className="relative w-full md:max-w-[420px] mx-3 mb-3 md:mb-0 p-6 rounded-3xl bg-[rgba(12,16,26,0.96)] border border-glass-border-hi shadow-[0_-20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] animate-[pwa-slide-up_320ms_cubic-bezier(0.2,0.8,0.2,1)_both]">
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-[#0a0e18] border border-glass-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="" width={36} height={36} />
              </span>
              <div>
                <h3
                  id="ios-install-title"
                  className="text-[15px] font-bold text-strong"
                >
                  افزودن به صفحه اصلی
                </h3>
                <p className="text-[12.5px] text-muted">
                  نظراتو رو مثل یک اپ روی آیفونت داشته باش.
                </p>
              </div>
            </div>

            <ol className="flex flex-col gap-3 text-[13.5px] text-strong leading-[1.7]">
              <li className="flex items-start gap-3">
                <span className="shrink-0 inline-flex w-6 h-6 items-center justify-center rounded-full bg-mint/20 text-mint text-[12px] font-bold">
                  ۱
                </span>
                <span className="flex-1">
                  از نوار پایین سافاری روی دکمه{" "}
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-glass border border-glass-border align-middle mx-1">
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M12 3v12" />
                      <path d="m7 8 5-5 5 5" />
                      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                    </svg>
                  </span>{" "}
                  اشتراک‌گذاری بزن.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 inline-flex w-6 h-6 items-center justify-center rounded-full bg-mint/20 text-mint text-[12px] font-bold">
                  ۲
                </span>
                <span className="flex-1">
                  تو فهرستی که باز میشه، گزینهٔ{" "}
                  <strong className="text-mint font-semibold">
                    «افزودن به صفحه اصلی»
                  </strong>{" "}
                  رو انتخاب کن.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 inline-flex w-6 h-6 items-center justify-center rounded-full bg-mint/20 text-mint text-[12px] font-bold">
                  ۳
                </span>
                <span className="flex-1">
                  بالا سمت راست روی{" "}
                  <strong className="text-mint font-semibold">«افزودن»</strong>{" "}
                  بزن. تمام!
                </span>
              </li>
            </ol>

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={dismiss}
                className="flex-1 h-11 rounded-full text-[13px] font-semibold text-strong bg-glass border border-glass-border hover:bg-glass-hover transition-colors duration-150"
              >
                فعلاً نه
              </button>
              <button
                type="button"
                onClick={() => setIosSheetOpen(false)}
                className="flex-1 h-11 rounded-full text-[13px] font-semibold text-[#06231b] bg-[linear-gradient(135deg,#5BE6B2_0%,#7B89FF_100%)] shadow-[0_4px_14px_rgba(91,230,178,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] transition-transform duration-150 active:scale-[0.97]"
              >
                باشه، فهمیدم
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
