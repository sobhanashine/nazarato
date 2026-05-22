"use client";

/**
 * The `/search` search box with a live typeahead. Once the query reaches 2
 * characters a dropdown of matching businesses appears below the field —
 * companies and Instagram shops alike. Clicking a suggestion jumps straight
 * to that profile.
 *
 * It is still a real `<form method="GET">`: pressing Enter or the submit
 * button runs the full `/search` query, and the active filters ride along as
 * hidden inputs so a fresh text search keeps them.
 */

import { useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, SearchIcon } from "@/components/icons";
import { SearchSuggestions } from "@/components/search/SearchSuggestions";
import { suggestBusinesses, type SearchQuery } from "@/lib/search";

export function SearchBox({ query }: { query: SearchQuery }) {
  const [value, setValue] = useState(query.q);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => suggestBusinesses(value), [value]);
  const showDropdown = open && value.trim().length >= 2;

  return (
    <form action="/search" method="GET" role="search" className="mb-5">
      <div
        ref={wrapRef}
        className="relative"
        onBlur={(e) => {
          // Keep the dropdown open while focus moves into it or the button.
          if (!wrapRef.current?.contains(e.relatedTarget)) setOpen(false);
        }}
      >
        <span
          aria-hidden
          className="absolute start-4 top-1/2 z-10 flex -translate-y-1/2 items-center text-mint"
        >
          <SearchIcon className="h-[18px] w-[18px]" />
        </span>
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          autoComplete="off"
          placeholder="نام کسب‌وکار یا فروشگاه…"
          aria-label="جستجو"
          className="h-14 w-full rounded-2xl border border-glass-border-hi bg-glass ps-12 pe-16 text-[15px] text-strong outline-none backdrop-blur-[18px] transition-[box-shadow,border-color] duration-300 placeholder:text-muted/55 focus:border-mint/55 focus:shadow-[0_0_0_4px_rgba(91,230,178,0.13)]"
        />
        <button
          type="submit"
          aria-label="جستجو"
          className="absolute end-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl bg-[linear-gradient(135deg,#5BE6B2_0%,#3FBF92_100%)] text-[#06231b] shadow-[0_6px_16px_-6px_rgba(91,230,178,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] transition-[transform,filter] duration-200 hover:brightness-105 active:scale-95 [&_svg]:h-[17px] [&_svg]:w-[17px]"
        >
          <ArrowLeftIcon />
        </button>

        {showDropdown && <SearchSuggestions suggestions={suggestions} />}
      </div>

      {/* Carry the active filters through a fresh text search. */}
      {query.type !== "all" && (
        <input type="hidden" name="type" value={query.type} />
      )}
      {query.sort !== "relevant" && (
        <input type="hidden" name="sort" value={query.sort} />
      )}
      {query.minRating > 0 && (
        <input type="hidden" name="rating" value={query.minRating} />
      )}
      {query.reviewedOnly && <input type="hidden" name="reviewed" value="1" />}
      {query.verifiedOnly && <input type="hidden" name="verified" value="1" />}
      {query.categories.map((c) => (
        <input key={c} type="hidden" name="category" value={c} />
      ))}

      <span aria-live="polite" className="sr-only">
        {showDropdown
          ? suggestions.length > 0
            ? `${suggestions.length.toLocaleString("fa-IR")} پیشنهاد`
            : "پیشنهادی نیست"
          : ""}
      </span>
    </form>
  );
}
