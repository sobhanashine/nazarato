/**
 * A wavy star verified badge in Lapis color, matching Instagram verification.
 */
export function IgVerifiedBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <span
      className="inline-flex items-center justify-center text-lapis [filter:drop-shadow(0_0_8px_rgba(123,137,255,0.6))] shrink-0"
      aria-label="فروشگاه تایید شده"
      title="تایید شده"
    >
      <svg viewBox="0 0 14 14" className={sizeClass} aria-hidden>
        <path d="M7 .8l1.6 1.4 2.1-.2.6 2 1.9 1-.8 2 .8 2-1.9 1-.6 2-2.1-.2L7 13.2 5.4 11.8l-2.1.2-.6-2-1.9-1 .8-2-.8-2 1.9-1 .6-2 2.1.2z" fill="currentColor" />
        <path d="M4.4 7.1l1.9 1.8 3.3-3.6" fill="none" stroke="#06121f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
