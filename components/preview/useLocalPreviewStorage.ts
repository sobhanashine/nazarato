"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "nazarato:local-preview-storage";

export function notifyLocalPreviewStorage() {
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Strings keep snapshots stable; unavailable browser storage is an empty state. */
export function useLocalPreviewStorage(key: string): string | null {
  const read = useCallback(() => {
    try { return window.localStorage.getItem(key); } catch { return null; }
  }, [key]);
  return useSyncExternalStore(subscribe, read, () => null);
}
