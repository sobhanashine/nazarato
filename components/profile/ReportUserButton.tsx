"use client";

import toast from "react-hot-toast";

export function ReportUserButton() {
  const handleReport = () => {
    toast("این قابلیت به‌زودی فعال خواهد شد", {
      icon: "⚙️",
      position: "bottom-center",
    });
  };

  return (
    <button
      onClick={handleReport}
      className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass/40 px-3.5 py-1.5 text-xs font-semibold text-muted transition-[background,color,border-color] duration-200 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
      گزارش این کاربر
    </button>
  );
}
