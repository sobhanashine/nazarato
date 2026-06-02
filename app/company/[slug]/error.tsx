"use client";

import { ErrorView } from "@/components/ui/ErrorView";

export default function CompanyError({
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
      logLabel="company/[slug]"
      message="نتونستیم صفحه این کسب‌وکار رو بارگذاری کنیم. دوباره تلاش کن."
    />
  );
}
