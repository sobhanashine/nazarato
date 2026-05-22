"use client";

import { useEffect } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { BTN_PRIMARY } from "@/components/ui/styles";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[search] render error:", error);
  }, [error]);

  return (
    <>
      <Header />
      <Container>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <h1 className="text-[1.5rem] font-black text-strong">یه چیزی خراب شد</h1>
          <p className="max-w-[42ch] text-[0.9rem] leading-[1.9] text-muted">
            نتونستیم نتایج جستجو رو بارگذاری کنیم. دوباره تلاش کن.
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
