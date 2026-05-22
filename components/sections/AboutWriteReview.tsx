"use client";

import { useReviewSheet } from "@/components/review/ReviewSheetProvider";

export function AboutWriteReview() {
  const { openReviewSheet } = useReviewSheet();

  return (
    <button
      type="button"
      onClick={() => openReviewSheet()}
      className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white px-10 py-4 font-bold text-black transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
    >
      <span className="relative z-10 flex items-center gap-2 text-[18px]">
        همین حالا نظر بنویس
        <svg
          className="w-5 h-5 -rotate-180 transition-transform group-hover:-translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-mint to-[#a8f0d3] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span
        aria-hidden
        className="absolute inset-[-8px] rounded-full bg-[radial-gradient(circle,rgba(91,230,178,0.45),transparent_70%)] blur-[10px] z-[-1] pointer-events-none animate-[fab-pulse_2.6s_ease-in-out_infinite] motion-reduce:animate-none"
      />
    </button>
  );
}
