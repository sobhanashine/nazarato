"use client";

import { useState } from "react";

export function SharePostButton({ title }: { title: string }) {
  const [note, setNote] = useState("");

  async function share() {
    const url = new URL(window.location.pathname, window.location.origin).href;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(url); setNote("لینک راهنما کپی شد"); }
    catch { setNote("کپی نشد؛ لینک را از نوار نشانی بردار"); }
  }

  return (
    <div>
      <button type="button" onClick={share} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-glass-border bg-paper px-4 py-2 text-sm font-semibold text-forest hover:border-mint">
        اشتراک‌گذاری راهنما
      </button>
      {note && <p role="status" className="mt-2 text-sm leading-7 text-muted">{note}</p>}
    </div>
  );
}
