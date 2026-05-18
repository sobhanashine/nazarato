"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CloseIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  MenuIcon,
  TwitterIcon,
} from "@/components/icons";

type NavItem = { href: string; label: string };

const glassButtonClasses =
  "inline-flex items-center justify-center w-[42px] h-[42px] rounded-xl bg-glass-strong backdrop-blur-[12px] backdrop-saturate-[160%] text-strong border border-glass-border cursor-pointer transition-[background,border-color] duration-200 hover:bg-glass-hover hover:border-glass-border-hi [&_svg]:w-[22px] [&_svg]:h-[22px]";

export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname() ?? "";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const overlay = (
    <div
      className="mobile-menu"
      data-open={open}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-label="منوی اصلی"
    >
      <div className="flex justify-between items-center h-[72px] px-5 border-b border-glass-border relative z-[1]">
        <span className="inline-flex items-center gap-2.5 text-strong text-[1.15rem] font-bold">
          <span className="brand-mark inline-block w-[38px] h-[38px]" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="brandGradMm" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#5BE6B2" />
                  <stop offset="1" stopColor="#7B89FF" />
                </linearGradient>
              </defs>
              <path d="M8 6h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H17l-6 5a1 1 0 0 1-1.6-.8V30H8a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Z" fill="url(#brandGradMm)" />
              <path d="M20 12.2l2.18 4.42 4.88.71-3.53 3.44.83 4.86L20 23.34l-4.36 2.29.83-4.86-3.53-3.44 4.88-.71L20 12.2Z" fill="#06231b" />
            </svg>
          </span>
          <span>نظراتو</span>
        </span>
        <button
          type="button"
          className={glassButtonClasses}
          aria-label="بستن منو"
          onClick={() => setOpen(false)}
        >
          <CloseIcon />
        </button>
      </div>

      <nav className="mobile-menu-nav">
        {items.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(item.href) ? "active-link" : undefined}
            style={{ animationDelay: `${0.08 * i + 0.05}s` }}
          >
            <span>{item.label}</span>
            <span aria-hidden="true" className="arrow">←</span>
          </Link>
        ))}
      </nav>

      <div className="px-5 pt-6 pb-8 border-t border-glass-border flex flex-col gap-5 relative z-[1]">
        <Link href="/login" className="btn-biz mobile-menu-foot-cta">
          ورود
        </Link>
        <div className="flex items-center justify-center gap-3">
          {[
            { Icon: InstagramIcon, label: "اینستاگرام" },
            { Icon: TwitterIcon, label: "توییتر" },
            { Icon: FacebookIcon, label: "فیسبوک" },
            { Icon: LinkedInIcon, label: "لینکدین" },
          ].map(({ Icon, label }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="grid place-items-center w-10 h-10 rounded-full bg-glass-strong border border-glass-border text-strong transition-[background,border-color] duration-200 hover:bg-glass-hover hover:border-glass-border-hi [&_svg]:w-4 [&_svg]:h-4"
            >
              <Icon />
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className={`md:hidden ${glassButtonClasses}`}
        aria-label="باز کردن منو"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
