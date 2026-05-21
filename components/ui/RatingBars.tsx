/**
 * Rating breakdown — five 5★→1★ bars with per-row counts.
 * New for pages-master.md §5.2 — used on `/company/[slug]` overview.
 */

import { StarIcon } from "@/components/icons";
import type { Rating } from "@/components/ui/RatingStars";

const ROWS: Rating[] = [5, 4, 3, 2, 1];

export function RatingBars({
  histogram,
  total,
}: {
  histogram: Record<Rating, number>;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-2" role="img" aria-label="توزیع امتیازها">
      {ROWS.map((star) => {
        const count = histogram[star] ?? 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-3 text-[0.8rem]">
            <span className="flex w-9 shrink-0 items-center gap-1 tabular-nums text-muted">
              {star.toLocaleString("fa-IR")}
              <StarIcon className="h-3 w-3 text-saffron [filter:drop-shadow(0_0_4px_rgba(245,181,68,0.4))]" />
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full border border-glass-border bg-glass">
              <div
                className="absolute inset-y-0 right-0 rounded-full bg-[linear-gradient(90deg,#3FBF92,#5BE6B2)]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-left tabular-nums text-muted">
              {count.toLocaleString("fa-IR")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
