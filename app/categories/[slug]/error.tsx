"use client";

import { ErrorView } from "@/components/ui/ErrorView";

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorView
      error={error}
      reset={reset}
      logLabel="categories/[slug]"
      message="نتونستیم این دسته‌بندی رو بارگذاری کنیم. دوباره تلاش کن."
    />
  );
}
