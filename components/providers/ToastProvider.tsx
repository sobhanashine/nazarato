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
      toastOptions={{
        duration: 4000,
        className: "!bg-[#0a0e18] !text-white !border !border-white/10",
        style: {
          direction: "rtl",
          fontFamily: "var(--font-vazirmatn)",
          borderRadius: "12px",
        },
      }}
    />
  );
}
