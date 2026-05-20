"use client";

import { useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleChevronLeftIcon,
  DoubleChevronRightIcon,
} from "@/components/icons";

const pageBtn =
  "w-10 h-10 rounded-full inline-flex items-center justify-center text-[0.95rem] tabular-nums " +
  "border bg-glass backdrop-blur-[10px] cursor-pointer transition-all duration-200 " +
  "[&_svg]:w-3.5 [&_svg]:h-3.5 disabled:opacity-40 disabled:cursor-not-allowed";

const pageBtnIdle =
  "border-glass-border text-strong enabled:hover:border-mint/50 enabled:hover:text-mint enabled:hover:bg-glass-hover";

const pageBtnActive =
  "border-transparent font-bold text-[#06231b] bg-[linear-gradient(135deg,#5BE6B2_0%,#3FBF92_100%)] " +
  "shadow-[0_6px_18px_-4px_rgba(91,230,178,0.55),inset_0_1px_0_rgba(255,255,255,0.45)]";

export function Pagination({ totalPages = 3 }: { totalPages?: number }) {
  const [page, setPage] = useState(1);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-10 md:gap-3">
      <button
        className={`${pageBtn} ${pageBtnIdle}`}
        disabled={page === 1}
        onClick={() => setPage(1)}
        aria-label="اول"
      >
        <DoubleChevronRightIcon />
      </button>
      <button
        className={`${pageBtn} ${pageBtnIdle}`}
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        aria-label="قبلی"
      >
        <ChevronRightIcon />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`${pageBtn} ${p === page ? pageBtnActive : pageBtnIdle}`}
          onClick={() => setPage(p)}
        >
          {p.toLocaleString("fa-IR")}
        </button>
      ))}
      <button
        className={`${pageBtn} ${pageBtnIdle}`}
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
        aria-label="بعدی"
      >
        <ChevronLeftIcon />
      </button>
      <button
        className={`${pageBtn} ${pageBtnIdle}`}
        disabled={page === totalPages}
        onClick={() => setPage(totalPages)}
        aria-label="آخر"
      >
        <DoubleChevronLeftIcon />
      </button>
    </div>
  );
}
