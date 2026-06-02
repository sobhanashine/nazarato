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
      message="نتونستیم نتایج جستجو رو بارگذاری کنیم. دوباره تلاش کن."
    />
  );
}
