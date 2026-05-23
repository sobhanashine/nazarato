/**
 * An Instagram shop avatar with a conic-gradient color ring around it.
 */
export function IgAvatar({
  initial,
  color,
  size = "sm",
}: {
  initial: string;
  color: string;
  size?: "sm" | "lg";
}) {
  const containerClasses =
    size === "lg"
      ? "w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[4px] [background:conic-gradient(from_45deg,#feda75_0%,#fa7e1e_20%,#d62976_45%,#962fbf_70%,#4f5bd5_90%,#feda75_100%)] flex items-center justify-center shrink-0 shadow-[0_8px_24px_rgba(214,41,118,0.4)]"
      : "w-[60px] h-[60px] rounded-full p-[3px] [background:conic-gradient(from_45deg,#feda75_0%,#fa7e1e_20%,#d62976_45%,#962fbf_70%,#4f5bd5_90%,#feda75_100%)] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(214,41,118,0.35)]";

  const innerClasses =
    size === "lg"
      ? "w-full h-full rounded-full border-[4px] border-[#0a0e18] flex items-center justify-center text-white text-[2rem] sm:text-[2.2rem] font-bold leading-none"
      : "w-full h-full rounded-full border-[2.5px] border-[#0a0e18] flex items-center justify-center text-white text-[1.2rem] font-bold leading-none";

  return (
    <div className={containerClasses}>
      <div className={innerClasses} style={{ background: color }}>
        {initial}
      </div>
    </div>
  );
}
