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
          <span className="brand-mark" aria-hidden="true">ن</span>
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
        <Link href="/business" className="btn-biz">
          برای کمپانی‌ها
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
