"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { useSessionStatus } from "./useSessionStatus";

type NavItem = { href: string; label: string };

export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname() ?? "";
  const status = useSessionStatus();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="باز کردن منو" aria-expanded={open} aria-controls="mobile-navigation"
        className="grid h-11 w-11 place-items-center rounded-lg border border-glass-border text-forest md:hidden [&_svg]:h-5 [&_svg]:w-5"><MenuIcon /></button>
      <dialog ref={dialogRef} id="mobile-navigation" aria-label="منوی نظراتو" onCancel={() => setOpen(false)} onClose={() => setOpen(false)}
        className="fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto border-0 bg-canvas p-0 text-strong backdrop:bg-black/30">
        <div className="flex min-h-16 items-center justify-between border-b border-glass-border px-6 pt-[env(safe-area-inset-top)]">
          <span className="text-[24px] font-extrabold text-forest">نظراتو<span aria-hidden className="text-pomegr">.</span></span>
          <button type="button" aria-label="بستن منو" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-lg text-forest [&_svg]:h-5 [&_svg]:w-5"><CloseIcon /></button>
        </div>
        <nav aria-label="همهٔ مسیرها" className="px-6 py-6">
          <ul className="divide-y divide-glass-border">
            {items.map(item => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return <li key={item.href}><Link href={item.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
                className={`flex min-h-16 items-center justify-between gap-4 py-4 text-[18px] ${active ? "font-bold text-forest" : "text-strong"}`}>
                {item.label}<span aria-hidden className="text-muted">←</span>
              </Link></li>;
            })}
          </ul>
        </nav>
        <div className="mx-6 border-t border-glass-border py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {status?.loggedIn ? <Link href="/profile" onClick={() => setOpen(false)} className="inline-flex min-h-12 items-center font-semibold text-forest">حساب من ←</Link>
            : process.env.NODE_ENV === "development" ? <Link href="/login" onClick={() => setOpen(false)} className="inline-flex min-h-12 items-center font-semibold text-forest">ورود آزمایشی ←</Link>
            : <p className="text-[14px] leading-7 text-muted">ورود عمومی و ثبت تجربه هنوز فعال نیست.</p>}
          <p className="mt-4 text-[12px] leading-6 text-muted">کافه و رستوران‌های رشت، نقطهٔ شروع نظراتو هستند.</p>
        </div>
      </dialog>
    </>
  );
}
