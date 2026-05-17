"use client";

import { useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleChevronLeftIcon,
  DoubleChevronRightIcon,
} from "@/components/icons";

export function Pagination({ totalPages = 3 }: { totalPages?: number }) {
  const [page, setPage] = useState(1);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button
        className="page-btn"
        disabled={page === 1}
        onClick={() => setPage(1)}
        aria-label="اول"
      >
        <DoubleChevronRightIcon />
      </button>
      <button
        className="page-btn"
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        aria-label="قبلی"
      >
        <ChevronRightIcon />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`page-btn${p === page ? " active" : ""}`}
          onClick={() => setPage(p)}
        >
          {p.toLocaleString("fa-IR")}
        </button>
      ))}
      <button
        className="page-btn"
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
        aria-label="بعدی"
      >
        <ChevronLeftIcon />
      </button>
      <button
        className="page-btn"
        disabled={page === totalPages}
        onClick={() => setPage(totalPages)}
        aria-label="آخر"
      >
        <DoubleChevronLeftIcon />
      </button>
    </div>
  );
}
