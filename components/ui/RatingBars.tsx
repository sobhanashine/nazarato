/**
 * Rating breakdown — five 5★→1★ bars, each tinted and glowing in its own
 * rating colour (aligned with the RatingStars palette).
 * New for pages-master.md §5.2 — used on `/company/[slug]` overview.
 */

import { StarIcon } from "@/components/icons";
import type { Rating } from "@/components/ui/RatingStars";

const ROWS: Rating[] = [5, 4, 3, 2, 1];

/** Per-rating bar fill + glow, matched to the RatingStars palette. */
const BAR_TINTS: Record<Rating, { from: string; to: string; glow: string }> = {
  5: { from: "#1E9A6F", to: "#5BE6B2", glow: "rgba(91,230,178,0.6)" },
  4: { from: "#6FA82A", to: "#BFE85B", glow: "rgba(191,232,91,0.55)" },
  3: { from: "#B07A12", to: "#F5C144", glow: "rgba(245,193,68,0.55)" },
  2: { from: "#C25A18", to: "#FF9A52", glow: "rgba(255,154,82,0.55)" },
  1: { from: "#B23446", to: "#FF7A8E", glow: "rgba(255,122,142,0.6)" },
};

export function RatingBars({
  histogram,
  total,
}: {
  histogram: Record<Rating, number>;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-2.5" role="img" aria-label="توزیع امتیازها">
      {ROWS.map((star) => {
        const count = histogram[star] ?? 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        const tint = BAR_TINTS[star];
        return (
          <div key={star} className="flex items-center gap-2.5 text-[0.78rem]">
            <span className="flex w-8 shrink-0 items-center justify-end gap-1 tabular-nums text-muted">
              {star.toLocaleString("fa-IR")}
              <StarIcon
                className="h-3 w-3"
                style={{
                  color: tint.to,
                  filter: `drop-shadow(0 0 4px ${tint.glow})`,
                }}
              />
            </span>
            {/* track sits on a recessed dark channel so the glowing fill pops */}
            <div className="relative h-2.5 flex-1 rounded-full border border-glass-border bg-[#0b0f1a]">
              <div
                className="absolute inset-y-0 right-0 rounded-full"
                style={{
                  width: count > 0 ? `max(${pct}%, 0.55rem)` : "0%",
                  background: `linear-gradient(90deg, ${tint.from}, ${tint.to})`,
                  boxShadow: count > 0 ? `0 0 9px ${tint.glow}` : undefined,
                }}
              />
            </div>
            <span className="w-7 shrink-0 text-left tabular-nums text-muted">
              {count.toLocaleString("fa-IR")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
