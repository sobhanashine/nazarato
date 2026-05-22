"use client";

/**
 * The homepage hero search bar — a pill-shaped `<form method="GET">` that
 * posts to `/search`, now with the same live company typeahead as the
 * `/search` page's `SearchBox`. Suggestions appear from the 2nd character;
 * pressing Enter (or the icon button) runs the full search.
 */

import { useMemo, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { SearchSuggestions } from "@/components/search/SearchSuggestions";
import { suggestBusinesses } from "@/lib/search";

export function HeroSearch() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const suggestions = useMemo(() => suggestBusinesses(value), [value]);
  const showDropdown = open && value.trim().length >= 2;

  return (
    <form
      ref={formRef}
      action="/search"
      method="GET"
      role="search"
      className="relative w-full max-w-[620px] h-[60px] mt-2 sm:h-16"
      onBlur={(e) => {
        // Stay open while focus moves into the dropdown or the submit button.
        if (!formRef.current?.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      {/* Soft gradient glow behind the input */}
      <div
        aria-hidden
        className="absolute inset-[-3px] rounded-full blur-[16px] opacity-75 z-[-1] bg-[linear-gradient(135deg,rgba(91,230,178,0.45),rgba(123,137,255,0.45),rgba(255,107,149,0.30))]"
      />
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
        placeholder="کسب و کار، فروشگاه یا دسته‌بندی..."
        aria-label="جستجو"
        className="w-full h-full pr-7 pl-[3.25rem] bg-[rgba(13,17,28,0.65)] backdrop-blur-[18px] backdrop-saturate-[180%] border border-glass-border-hi rounded-full text-[15px] text-strong outline-none transition-[box-shadow,border-color] duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] placeholder:text-[#6b7385] focus:border-mint/55 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_4px_rgba(91,230,178,0.18),0_12px_40px_rgba(0,0,0,0.45)]"
      />
      <button
        type="submit"
        aria-label="جستجو"
        className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center text-mint transition-transform duration-200 hover:scale-110"
      >
        <SearchIcon />
      </button>
      {showDropdown && <SearchSuggestions suggestions={suggestions} />}

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
