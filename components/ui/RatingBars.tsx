import { StarIcon } from "@/components/icons";
import type { Rating } from "@/components/ui/RatingStars";

const ROWS: Rating[] = [5, 4, 3, 2, 1];
const BAR_COLORS: Record<Rating, string> = {
  5: "var(--mint)",
  4: "var(--mint)",
  3: "var(--saffron)",
  2: "var(--saffron)",
  1: "var(--pomegr)",
};

export function RatingBars({ histogram, total }: { histogram: Record<Rating, number>; total: number }) {
  const description = ROWS.map(star => `${star.toLocaleString("fa-IR")} ستاره: ${(histogram[star] ?? 0).toLocaleString("fa-IR")} تجربه`).join("، ");
  return (
    <div className="flex flex-col gap-3" role="img" aria-label={`توزیع امتیازها؛ ${description}`}>
      {ROWS.map(star => {
        const count = histogram[star] ?? 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2.5 text-sm">
            <span className="flex w-9 shrink-0 items-center justify-end gap-1 tabular-nums text-muted">
              {star.toLocaleString("fa-IR")}
              <StarIcon className="h-3 w-3 text-saffron" aria-hidden />
            </span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-glass-strong">
              <div className="absolute inset-y-0 right-0 rounded-full" style={{ width: `${pct}%`, background: BAR_COLORS[star] }} />
            </div>
            <span className="w-8 shrink-0 text-left tabular-nums text-muted">{count.toLocaleString("fa-IR")}</span>
          </div>
        );
      })}
    </div>
  );
}
