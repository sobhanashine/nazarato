import { NotFoundView } from "@/components/ui/NotFoundView";

/**
 * Root not-found. Next serves this for any unmatched URL across the whole app
 * AND as the fallback for `notFound()` calls in segments without their own
 * `not-found.tsx`. Returns a 404 status for non-streamed responses.
 */
export default function NotFound() {
  return <NotFoundView />;
}
