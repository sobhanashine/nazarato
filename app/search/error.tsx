"use client";

import { ErrorView } from "@/components/ui/ErrorView";

export default function SearchError({
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
      logLabel="search"
      message="نتایج جستجو دریافت نشد. دوباره تلاش کن."
    />
  );
}
