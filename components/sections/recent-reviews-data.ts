import { unstable_rethrow } from "next/navigation";

interface HomepageViewer {
  id: string;
}

interface HomepageReviewDependencies<TReview> {
  getViewer: () => Promise<HomepageViewer | null>;
  getReviews: (
    viewerId: string | undefined,
  ) => Promise<{ reviews: readonly TReview[]; total: number }>;
  fallback: readonly TReview[];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

/**
 * Keeps the public homepage usable when its optional database-backed review
 * rail is unavailable. The core page must not become a 500 because a secondary
 * section cannot reach Supabase.
 */
export async function loadHomepageReviews<TReview>({
  getViewer,
  getReviews,
  fallback,
}: HomepageReviewDependencies<TReview>): Promise<readonly TReview[]> {
  try {
    const viewer = await getViewer();
    const { reviews } = await getReviews(viewer?.id);
    return reviews.length > 0 ? reviews : fallback;
  } catch (error: unknown) {
    unstable_rethrow(error);
    console.warn(
      "[homepage] recent reviews unavailable; using static fallback",
      { error: errorMessage(error) },
    );
    return fallback;
  }
}
