import { redirect } from "next/navigation";

/**
 * Legacy `/profile/notifications` — moved to `/notifications` per #30.
 * Kept as a redirect so push-notification deep links and existing bookmarks
 * don't 404. The redirect runs through the `(user)` layout's auth gate, so
 * an unauthenticated visit still bounces through `/login?next=/notifications`.
 */
export default function ProfileNotificationsLegacyRedirect() {
  redirect("/notifications");
}
