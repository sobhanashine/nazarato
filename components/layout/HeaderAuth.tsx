"use client";

import Link from "next/link";
import { useSessionStatus } from "./useSessionStatus";

export function HeaderAuth() {
  const status = useSessionStatus();
  if (status?.loggedIn) {
    return <Link href="/profile" className="hidden min-h-11 items-center border-b border-mint px-1 text-[13px] font-semibold text-forest md:inline-flex">حساب من</Link>;
  }
  if (process.env.NODE_ENV !== "development") {
    return <span className="hidden text-[12px] text-muted lg:inline">ورود عمومی هنوز فعال نیست</span>;
  }
  return <Link href="/login" className="hidden min-h-11 items-center rounded-lg border border-glass-border px-4 text-[13px] font-medium text-forest hover:border-mint md:inline-flex">ورود آزمایشی</Link>;
}
