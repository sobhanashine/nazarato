"use client";

import { ErrorView } from "@/components/ui/ErrorView";

export default function ShopError({
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
      logLabel="shop/[handle]"
      message="اطلاعات این کسب‌وکار دریافت نشد. دوباره تلاش کن."
    />
  );
}
