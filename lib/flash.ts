/**
 * Flash messages — a one-shot toast that survives a client-side redirect.
 *
 * A `toast()` fired immediately before `router.push` races the navigation and
 * barely shows on the destination. Instead, stash the message here before
 * navigating; `ToastProvider` consumes it once the new route mounts, so the
 * toast appears *after* the redirect and gets its full duration.
 */
const FLASH_KEY = "nzr_flash";

/** Stash a success message to surface right after the next navigation. */
export function setFlash(message: string): void {
  try {
    sessionStorage.setItem(FLASH_KEY, message);
  } catch {
    // sessionStorage can be unavailable (private mode) — flash is best-effort.
  }
}

/** Read and clear the pending flash message, if any. */
export function consumeFlash(): string | null {
  try {
    const message = sessionStorage.getItem(FLASH_KEY);
    if (message) sessionStorage.removeItem(FLASH_KEY);
    return message;
  } catch {
    return null;
  }
}
