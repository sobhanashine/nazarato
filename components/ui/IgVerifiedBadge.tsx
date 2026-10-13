/** Shown only when the shop's source data explicitly marks it verified. */
export function IgVerifiedBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <span role="img" className="inline-flex shrink-0 items-center justify-center text-forest" aria-label="فروشگاه تأیید شده" title="تأیید شده">
      <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3 20 6v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </svg>
    </span>
  );
}
