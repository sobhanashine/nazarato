"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { suggestBusinesses } from "@/lib/search";
import type { Business } from "@/lib/data/businesses";
import type { SearchArea } from "@/lib/local-area";

export function HeroSearch({ businesses, area }: { businesses: Business[]; area: SearchArea }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const suggestionPointer = useRef(false);
  const suggestions = useMemo(() => suggestBusinesses(value, 6, businesses), [value, businesses]);
  const showDropdown = open && value.trim().length >= 2 && suggestions.length > 0;

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !formRef.current?.contains(event.target)) {
        suggestionPointer.current = false;
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      suggestionPointer.current = false;
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [open]);

  return (
    <form ref={formRef} action="/search" method="GET" role="search" className="relative w-full"
      onBlur={event => {
        if (!suggestionPointer.current && !formRef.current?.contains(event.relatedTarget)) setOpen(false);
      }}>
      <label htmlFor="home-place-search" className="mb-2 block text-[13px] font-semibold text-strong">نام کافه یا رستوران</label>
      <input type="hidden" name="area" value={area} />
      <div className="flex min-h-14 rounded-lg border border-glass-border-hi bg-paper focus-within:border-mint focus-within:ring-2 focus-within:ring-mint/15">
        <input id="home-place-search" type="search" name="q" value={value} autoComplete="off"
          onChange={event => { setValue(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}
          placeholder="نام مکان را بنویس" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[16px] text-strong outline-none placeholder:text-muted" />
        <button type="submit" aria-label="جستجوی مکان" className="m-1 grid min-h-11 w-12 shrink-0 place-items-center rounded-md bg-forest text-white hover:opacity-90 [&_svg]:h-5 [&_svg]:w-5"><SearchIcon /></button>
      </div>
      {showDropdown && <ul aria-label="مکان‌های مطابق جستجو"
        onPointerDown={() => { suggestionPointer.current = true; }}
        onClick={() => { suggestionPointer.current = false; setOpen(false); }}
        onPointerCancel={() => { suggestionPointer.current = false; setOpen(false); }}
        className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 divide-y divide-glass-border rounded-lg border border-glass-border bg-paper">
        {suggestions.map(suggestion => <li key={suggestion.href}><Link href={suggestion.href} className="block min-h-12 px-4 py-3 hover:bg-canvas">
          <span className="block text-[15px] font-semibold text-strong">{suggestion.name}</span>
          <span className="mt-1 block text-[12px] text-muted">{suggestion.meta}</span>
        </Link></li>)}
      </ul>}
      <span aria-live="polite" className="sr-only">{showDropdown ? `${suggestions.length.toLocaleString("fa-IR")} مکان مطابق جستجو` : ""}</span>
    </form>
  );
}
