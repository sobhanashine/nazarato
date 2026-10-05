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

export function SearchBox({ query, businesses }: { query: SearchQuery; businesses?: import("@/lib/data/businesses").Business[] }) {
  const [value, setValue] = useState(query.q);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => suggestBusinesses(value, 6, businesses), [value, businesses]);
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
          placeholder="نام مکان یا نشانی…"
          aria-label="نام مکان یا نشانی"
          className="h-14 w-full rounded-xl border border-glass-border-hi bg-paper ps-12 pe-16 text-base text-strong outline-none transition-colors placeholder:text-muted focus:border-forest focus:ring-2 focus:ring-forest/15"
        />
        <button
          type="submit"
          aria-label="جستجو"
          className="absolute end-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg bg-forest text-white transition-colors hover:bg-[#174539] [&_svg]:h-5 [&_svg]:w-5"
        >
          <ArrowLeftIcon />
        </button>

        {showDropdown && <SearchSuggestions suggestions={suggestions} />}
      </div>

      {/* Carry the active filters through a fresh text search. */}
      <input type="hidden" name="area" value={query.area} />
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
