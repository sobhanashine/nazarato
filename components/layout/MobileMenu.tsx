"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  CloseIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  MenuIcon,
  TwitterIcon,
} from "@/components/icons";
import { BTN_PRIMARY } from "@/components/ui/styles";
import { useReviewSheet } from "@/components/review/ReviewSheetProvider";
import { useSessionStatus } from "./useSessionStatus";

type NavItem = { href: string; label: string };

// Hydration-safe "mounted on the client" flag: false during SSR + the hydration
// render, true thereafter — no effect, no setState-in-effect.
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

const glassButtonClasses =
  "inline-flex items-center justify-center w-11 h-11 rounded-xl bg-glass-strong backdrop-blur-[12px] backdrop-saturate-[160%] text-strong border border-glass-border cursor-pointer transition-[background,border-color] duration-200 hover:bg-glass-hover hover:border-glass-border-hi [&_svg]:w-[22px] [&_svg]:h-[22px]";

const brandMark =
  "[filter:drop-shadow(0_6px_16px_rgba(91,230,178,0.45))] [&_svg]:w-full [&_svg]:h-full [&_svg]:block";

const navLinkBase =
  "group/link flex items-center justify-between py-[1.05rem] px-[1.4rem] text-[1.05rem] font-medium text-strong rounded-2xl border backdrop-blur-[10px] transition-[background,transform,border-color] duration-200 opacity-0 translate-y-2 group-data-[open=true]:animate-[mm-in_0.4s_cubic-bezier(0.2,0.7,0.2,1)_forwards]";

export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const pathname = usePathname() ?? "";
  const status = useSessionStatus();
  const { openReviewSheet } = useReviewSheet();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
      className="group fixed inset-0 w-screen h-[100dvh] z-[9999] flex flex-col overflow-y-auto [-webkit-overflow-scrolling:touch] bg-[rgba(7,10,18,0.78)] backdrop-blur-[26px] backdrop-saturate-[180%] text-strong opacity-0 invisible pointer-events-none -translate-y-3 transition-[opacity,transform,visibility] duration-300 ease-out data-[open=true]:opacity-100 data-[open=true]:visible data-[open=true]:pointer-events-auto data-[open=true]:translate-y-0"
      data-open={open}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-label="منوی اصلی"
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 0%, rgba(91, 230, 178, 0.22), transparent 60%)," +
            "radial-gradient(ellipse 60% 60% at 100% 100%, rgba(123, 137, 255, 0.18), transparent 60%)",
        }}
      />

      <div className="flex justify-between items-center h-[72px] px-5 border-b border-glass-border relative z-[1] standalone:h-[calc(72px+env(safe-area-inset-top)+16px)] standalone:pt-[calc(env(safe-area-inset-top)+16px)]">
        <span className="inline-flex items-center gap-2.5 text-strong text-[1.15rem] font-bold">
          <span className={`${brandMark} inline-block w-[38px] h-[38px]`} aria-hidden="true">
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

      <nav className="flex-1 flex flex-col gap-3 py-8 px-5 relative z-[1] standalone:pt-12">
        {items.map((item, i) => {
          if (item.href === "/write-review") {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  setOpen(false);
                  openReviewSheet();
                }}
                className={`${navLinkBase} relative z-[1] w-full ${
                  isActive(item.href)
                    ? "bg-[linear-gradient(135deg,rgba(91,230,178,0.22),rgba(91,230,178,0.08))] border-mint/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_24px_rgba(91,230,178,0.22)]"
                    : "bg-glass border-glass-border hover:bg-glass-hover hover:border-glass-border-hi"
                }`}
                style={{ animationDelay: `${0.08 * i + 0.05}s` }}
              >
                <span
                  aria-hidden
                  className="absolute inset-[-8px] rounded-2xl bg-[radial-gradient(circle,rgba(91,230,178,0.45),transparent_70%)] blur-[10px] z-[-1] pointer-events-none animate-[fab-pulse_2.6s_ease-in-out_infinite] motion-reduce:animate-none"
                />
                <span>{item.label}</span>
                <span
                  aria-hidden="true"
                  className="text-[1.1rem] opacity-50 transition-[opacity,transform] duration-200 group-hover/link:opacity-100 group-hover/link:-translate-x-[3px]"
                >
                  ←
                </span>
              </button>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`${navLinkBase} relative z-[1] ${
                isActive(item.href)
                  ? "bg-[linear-gradient(135deg,rgba(91,230,178,0.22),rgba(91,230,178,0.08))] border-mint/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_24px_rgba(91,230,178,0.22)]"
                  : "bg-glass border-glass-border hover:bg-glass-hover hover:border-glass-border-hi"
              }`}
              style={{ animationDelay: `${0.08 * i + 0.05}s` }}
            >
              <span>{item.label}</span>
              <span
                aria-hidden="true"
                className="text-[1.1rem] opacity-50 transition-[opacity,transform] duration-200 group-hover/link:opacity-100 group-hover/link:-translate-x-[3px]"
              >
                ←
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 pt-6 pb-8 border-t border-glass-border flex flex-col gap-5 relative z-[1]">
        <Link
          href={status?.loggedIn ? "/profile" : "/login"}
          onClick={() => setOpen(false)}
          className={`${BTN_PRIMARY} w-full py-4 px-6 text-base`}
        >
          {status?.loggedIn ? "پروفایل من" : "ورود"}
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
              className="grid place-items-center w-11 h-11 rounded-full bg-glass-strong border border-glass-border text-strong transition-[background,border-color] duration-200 hover:bg-glass-hover hover:border-glass-border-hi [&_svg]:w-4 [&_svg]:h-4"
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
