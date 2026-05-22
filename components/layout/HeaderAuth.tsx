"use client";

/**
 * The header's auth slot (desktop only — mobile login lives in `MobileMenu`,
 * and a signed-in user reaches `/profile` via the bottom `MobileTabBar`).
 *
 * Signed out → the «ورود» button. Signed in → a round avatar that links to
 * `/profile`. While the status loads, a neutral circle skeleton holds the
 * space so the signed-in case resolves without a layout shift.
 */
import Link from "next/link";
import { BTN_PRIMARY } from "@/components/ui/styles";
import { useSessionStatus } from "./useSessionStatus";

export function HeaderAuth() {
  const status = useSessionStatus();

  if (status === null) {
    return (
      <span
        className="hidden h-11 w-11 animate-pulse rounded-full border border-glass-border bg-glass md:block"
        aria-hidden
      />
    );
  }

  if (status.loggedIn) {
    const initial = status.name?.trim().charAt(0) || "؟";
    return (
      <Link
        href="/profile"
        aria-label="پروفایل من"
        title="پروفایل من"
        className="hidden h-11 w-11 place-items-center rounded-full bg-[linear-gradient(135deg,#5BE6B2_0%,#3FBF92_100%)] text-[0.95rem] font-bold text-[#06231b] shadow-[0_6px_18px_-6px_rgba(91,230,178,0.6)] transition-[transform,filter] duration-200 hover:-translate-y-px hover:brightness-105 md:grid"
      >
        {initial}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className={`${BTN_PRIMARY} max-md:hidden px-5 min-h-11 text-sm`}
    >
      ورود
    </Link>
  );
}
