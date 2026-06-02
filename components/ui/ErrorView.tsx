"use client";

import { useEffect } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { BTN_PRIMARY } from "@/components/ui/styles";

/**
 * Branded, RTL error-boundary body shared by every `error.tsx`. Error
 * boundaries must be Client Components (they use `reset`), so this is one too.
 * `logLabel` namespaces the console error; `message` lets each segment explain
 * what failed to load. The root layout doesn't render Header/Footer, so we do.
 */
export function ErrorView({
  error,
  reset,
  logLabel,
  message = "یه مشکلی پیش اومد و این صفحه بارگذاری نشد. دوباره تلاش کن.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** Console namespace, e.g. "blog/[slug]" → `[blog/[slug]] render error:`. */
  logLabel: string;
  message?: string;
}) {
  useEffect(() => {
    console.error(`[${logLabel}] render error:`, error);
  }, [error, logLabel]);

  return (
    <>
      <Header />
      <Container>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <h1 className="text-[1.5rem] font-black text-strong">یه چیزی خراب شد</h1>
          <p className="max-w-[42ch] text-[0.9rem] leading-[1.9] text-muted">
            {message}
          </p>
          <button
            type="button"
            onClick={reset}
            className={`${BTN_PRIMARY} px-7 py-3 text-[0.95rem]`}
          >
            تلاش دوباره
          </button>
        </div>
      </Container>
      <Footer />
    </>
  );
}
