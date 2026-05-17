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
      <div className="mobile-menu-head">
        <span className="mobile-menu-brand">
          <span className="brand-mark" aria-hidden="true">
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
          className="mobile-menu-close"
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

      <div className="mobile-menu-foot">
        <Link href="/login" className="btn-biz">
          ورود
        </Link>
        <div className="mobile-menu-socials">
          <a href="#" aria-label="اینستاگرام"><InstagramIcon /></a>
          <a href="#" aria-label="توییتر"><TwitterIcon /></a>
          <a href="#" aria-label="فیسبوک"><FacebookIcon /></a>
          <a href="#" aria-label="لینکدین"><LinkedInIcon /></a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="menu-trigger"
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
