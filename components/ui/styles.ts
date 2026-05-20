/**
 * Shared Tailwind utility bundles.
 *
 * These replace the named component classes that used to live in
 * `app/globals.css`. Each is a plain string concatenated into `className`,
 * so callers can append/override utilities inline. No CSS is generated here —
 * Tailwind scans these literals like any other class string.
 */

/** Liquid-glass surface — was `.glass` (also base of post cards, sidebar boxes). */
export const GLASS =
  "relative bg-glass border border-glass-border rounded-glass " +
  "shadow-[var(--shadow-sm)] backdrop-blur-[18px] backdrop-saturate-[160%]";

/** Centered page gutter — was `.container`. Prefer the <Container> component. */
export const CONTAINER =
  "relative w-full max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-12 xl:px-16";

/** Hide native scrollbars on an overflow container — was `.hide-scroll`. */
export const HIDE_SCROLL =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/** Mint→teal gradient pill button — was `.btn-biz` / `.btn-read-more`.
 *  Callers add their own padding + font-size. */
export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full " +
  "bg-[linear-gradient(135deg,#5BE6B2_0%,#3FBF92_100%)] font-bold text-[#06231b] " +
  "whitespace-nowrap shadow-[0_8px_22px_-6px_rgba(91,230,178,0.55)," +
  "inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.18)] " +
  "transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-px hover:brightness-105";

/** Glass tag chip — was `.tag-badge`. */
export const TAG_BADGE =
  "inline-flex items-center py-[0.35rem] px-[0.85rem] rounded-full bg-glass " +
  "border border-glass-border backdrop-blur-[8px] text-[0.78rem] font-medium text-muted " +
  "transition-[background,color,border-color] duration-200 " +
  "hover:bg-mint/12 hover:text-mint hover:border-mint/40";
