export default function Loading() {
  return (
    <div aria-busy="true">
      <p role="status" className="text-[14px] leading-7 text-muted">در حال دریافت تجربه‌های تو…</p>
      <div aria-hidden className="mt-5 divide-y divide-glass-border border-y border-glass-border">
        {[0, 1, 2].map(row => <div key={row} className="flex min-h-24 flex-col justify-center gap-3 py-5">
          <div className="h-5 w-2/3 max-w-xs rounded-sm bg-line/65" />
          <div className="h-3 w-1/3 max-w-40 rounded-sm bg-line/65" />
        </div>)}
      </div>
    </div>
  );
}
