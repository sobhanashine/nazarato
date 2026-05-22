/**
 * Five-star rating display with a per-rating gradient + glow.
 * Lifted from the inline `<Stars />` in `RecentReviews.tsx` — see pages-master.md §5.2.
 *
 * Server component (no hooks) so it can render inside RSC sections.
 * The gradient `id` is keyed on `rating`, so two stars with the same rating
 * share one definition — duplicate `<defs>` are identical and resolve fine.
 */

export type Rating = 1 | 2 | 3 | 4 | 5;

export type StarPalette = {
  light: string;
  mid: string;
  dark: string;
  glow: string;
};

/** The star glyph path — shared with the write-review rating picker. */
export const STAR_PATH =
  "m12 16.3-3.7 2.825q-.275.225-.6.213t-.575-.188-.387-.475-.013-.65L8.15 13.4l-3.625-2.575q-.3-.2-.375-.525t.025-.6.35-.488.6-.212H9.6l1.45-4.8q.125-.35.388-.538T12 3.475t.563.188.387.537L14.4 9h4.475q.35 0 .6.213t.35.487.025.6-.375.525L15.85 13.4l1.425 4.625q.125.35-.012.65t-.388.475-.575.188-.6-.213z";

/** Per-rating gradient stops + glow colour — red at 1★, mint-green at 5★. */
export const STAR_PALETTES: Record<Rating, StarPalette> = {
  5: { light: "#A8FFD6", mid: "#5BE6B2", dark: "#1E9A6F", glow: "rgba(91, 230, 178, 0.55)" },
  4: { light: "#E2F8A0", mid: "#BFE85B", dark: "#6FA82A", glow: "rgba(191, 232, 91, 0.55)" },
  3: { light: "#FFE0A0", mid: "#F5C144", dark: "#B07A12", glow: "rgba(245, 193, 68, 0.55)" },
  2: { light: "#FFD0A8", mid: "#FF9A52", dark: "#C25A18", glow: "rgba(255, 154, 82, 0.55)" },
  1: { light: "#FFC1C9", mid: "#FF7A8E", dark: "#B23446", glow: "rgba(255, 122, 142, 0.6)" },
};

export function RatingStars({
  rating,
  className = "",
}: {
  rating: Rating;
  className?: string;
}) {
  const palette = STAR_PALETTES[rating];
  const gradId = `star-grad-${rating}`;
  return (
    <div
      className={`flex gap-[2px] shrink-0 ${className}`}
      data-rating={rating}
      dir="ltr"
      role="img"
      aria-label={`${rating} از ۵`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const lit = i < rating;
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className="w-[18px] h-[18px] sm:w-5 sm:h-5 shrink-0"
            style={
              lit
                ? { filter: `drop-shadow(0 0 6px ${palette.glow})` }
                : { opacity: 0.4 }
            }
            aria-hidden
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={palette.light} />
                <stop offset="55%" stopColor={palette.mid} />
                <stop offset="100%" stopColor={palette.dark} />
              </linearGradient>
            </defs>
            {lit ? (
              <path d={STAR_PATH} fill={`url(#${gradId})`} />
            ) : (
              <path
                d={STAR_PATH}
                fill="none"
                stroke={palette.mid}
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}
