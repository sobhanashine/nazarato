"use client";

import { ErrorView } from "@/components/ui/ErrorView";

export default function BlogPostError({
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
      logLabel="blog/[slug]"
      message="این مطلب دریافت نشد. دوباره تلاش کن."
    />
  );
}
