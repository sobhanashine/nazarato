/**
 * Shared Tailwind utility bundles.
 *
 * These replace the named component classes that used to live in
 * `app/globals.css`. Each is a plain string concatenated into `className`,
 * so callers can append/override utilities inline. No CSS is generated here —
 * Tailwind scans these literals like any other class string.
 */

/** Shared paper surface; the legacy name keeps existing callers compatible. */
export const GLASS =
  "relative bg-glass border border-glass-border rounded-glass " +
  "shadow-[var(--shadow-sm)]";

/** Centered page gutter — was `.container`. Prefer the <Container> component. */
export const CONTAINER =
  "relative w-full max-w-[1180px] mx-auto px-5 sm:px-6 lg:px-10";

/** Hide native scrollbars on an overflow container — was `.hide-scroll`. */
export const HIDE_SCROLL =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/** Primary forest button.
 *  Callers add their own padding + font-size. */
export const BTN_PRIMARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl " +
  "bg-forest font-bold text-white " +
  "whitespace-nowrap transition-colors duration-150 hover:bg-[#174539] disabled:opacity-50";

/** Glass tag chip — was `.tag-badge`. */
export const TAG_BADGE =
  "inline-flex items-center py-[0.35rem] px-[0.85rem] rounded-full bg-glass " +
  "border border-glass-border text-sm font-medium text-muted " +
  "transition-[background,color,border-color] duration-200 " +
  "hover:bg-mint/12 hover:text-mint hover:border-mint/40";
