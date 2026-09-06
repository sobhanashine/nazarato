import { unstable_rethrow } from "next/navigation";

interface HomepageViewer {
  id: string;
}

interface HomepageReviewDependencies<TReview> {
  getViewer: () => Promise<HomepageViewer | null>;
  getReviews: (
    viewerId: string | undefined,
  ) => Promise<{ reviews: readonly TReview[]; total: number }>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

/**
 * Keeps the public homepage usable when its optional database-backed review
 * rail is unavailable. Missing or failed data stays empty so public surfaces
 * never imply that fixture reviews are approved pilot evidence.
 */
export async function loadHomepageReviews<TReview>({
  getViewer,
  getReviews,
}: HomepageReviewDependencies<TReview>): Promise<readonly TReview[]> {
  try {
    const viewer = await getViewer();
    const { reviews } = await getReviews(viewer?.id);
    return reviews;
  } catch (error: unknown) {
    unstable_rethrow(error);
    console.warn(
      "[homepage] recent reviews unavailable; hiding the review rail",
      { error: errorMessage(error) },
    );
    return [];
  }
}
