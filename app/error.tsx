"use client";

import { ErrorView } from "@/components/ui/ErrorView";

/**
 * Global error boundary — catches runtime errors on any route that lacks its
 * own segment-level `error.tsx`. Renders inside the root layout, so (unlike
 * `global-error.tsx`) it does not declare its own <html>/<body>.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorView error={error} reset={reset} logLabel="app" />;
}
