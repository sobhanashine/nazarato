import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center px-4 py-8 sm:justify-center sm:px-6 sm:py-12">
      <Link href="/" aria-label="نظراتو، بازگشت به صفحهٔ اول" className="mb-6 inline-flex min-h-11 items-center text-[26px] font-extrabold text-forest">نظراتو<span aria-hidden className="text-pomegr">.</span></Link>
      <div className="w-full max-w-[420px]">{children}</div>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center text-[13px] text-muted hover:text-forest">بازگشت به کشف مکان‌ها ←</Link>
    </main>
  );
}
