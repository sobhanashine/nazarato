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
      message="مکان‌های این دسته دریافت نشد. دوباره تلاش کن."
    />
  );
}
