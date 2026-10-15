import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Auth route-group layout — a centered, single-card shell.
 *
 * Renders no `<Header/>` / `<Footer/>` (those are mounted per-page elsewhere)
 * so the OTP flow stays a focused, distraction-free task. The global
 * `MobileTabBar` lives in the root layout — a nested layout cannot un-mount it,
 * so the bar hides itself on `/login*` (see `components/layout/MobileTabBar`).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Link
        href="/"
        className="mb-8 text-2xl font-black tracking-tight text-strong"
      >
        نظراتو
      </Link>
      <div className="w-full max-w-[420px]">{children}</div>
    </main>
  );
}
