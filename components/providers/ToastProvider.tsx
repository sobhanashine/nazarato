"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { consumeFlash } from "@/lib/flash";

/**
 * Mounts the global `<Toaster/>` and, after every navigation, surfaces any
 * flash message stashed before a redirect (see `lib/flash.ts`). Lives in the
 * root layout so it persists across client-side navigations.
 */
export function ToastProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const message = consumeFlash();
    if (message) toast.success(message);
  }, [pathname]);

  return (
    <Toaster
      position="bottom-center"
      containerStyle={{ bottom: "calc(88px + env(safe-area-inset-bottom))" }}
      toastOptions={{
        duration: 4000,
        className: "!bg-paper !text-strong !border !border-glass-border",
        style: {
          direction: "rtl",
          fontFamily: "var(--font-vazirmatn)",
          borderRadius: "12px",
        },
      }}
    />
  );
}
