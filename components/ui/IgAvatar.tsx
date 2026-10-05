/** A neutral initial when the shop has no publishable profile photo. */
export function IgAvatar({
  initial,
  size = "sm",
}: {
  initial: string;
  color: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-xl border border-mint/15 bg-mint/5 font-bold leading-none text-forest ${size === "lg" ? "h-20 w-20 text-3xl sm:h-24 sm:w-24" : "h-12 w-12 text-xl"}`}
    >
      {initial}
    </span>
  );
}
