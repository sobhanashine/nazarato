import { GLASS } from "@/components/ui/styles";

export default function OwnerInsightsLoading() {
  return (
    <main aria-busy="true" aria-label="در حال آماده‌سازی تحلیل" className="space-y-5">
      <div className="space-y-2">
        <div className="h-7 w-52 animate-pulse rounded-lg bg-glass-border motion-reduce:animate-none" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-glass-border/70 motion-reduce:animate-none" />
      </div>
      <div className="h-56 animate-pulse rounded-[1.75rem] border border-mint/15 bg-mint/[0.04] motion-reduce:animate-none" />
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((item) => (
          <div key={item} className={`${GLASS} h-72 animate-pulse motion-reduce:animate-none`} />
        ))}
      </div>
      <span className="sr-only">تحلیل نظرات در حال بارگذاری است.</span>
    </main>
  );
}
