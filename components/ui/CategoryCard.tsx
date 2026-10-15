import Link from "next/link";
import { GLASS } from "@/components/ui/styles";
import type { Category } from "@/lib/data/categories";

const base =
  `${GLASS} h-full cursor-pointer overflow-hidden transition-[transform,border-color,background] duration-300 hover:-translate-y-[3px] hover:border-glass-border-hi hover:bg-glass-hover before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(91,230,178,0),rgba(91,230,178,0.08))] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100 before:pointer-events-none`;

export function CategoryCard({
  category,
  compact = false,
}: {
  category: Category;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link
        href={category.href}
        className={`${base} flex flex-col items-center justify-center text-center gap-3.5 py-7 px-4`}
      >
        <div className="relative flex items-end justify-end w-[52px] h-[48px]">
          {category.icon}
          <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[radial-gradient(circle,rgba(91,230,178,0.22),rgba(91,230,178,0.05))] border border-mint/20 z-[1]" />
        </div>
        <h5 className="relative text-[0.98rem] font-semibold text-strong leading-[1.4]">
          {category.title}
        </h5>
      </Link>
    );
  }

  return (
    <Link href={category.href} className={`${base} flex flex-col py-6 px-7`}>
      <div className="relative flex items-end justify-end w-[58px] h-[52px] mb-[1.1rem]">
        {category.icon}
        <div className="absolute bottom-0 right-0 w-11 h-11 rounded-full bg-[radial-gradient(circle,rgba(91,230,178,0.22),rgba(91,230,178,0.05))] border border-mint/20 z-[1]" />
      </div>
      <h5 className="relative text-[1.1rem] font-semibold text-strong mb-[0.45rem]">
        {category.title}
      </h5>
      <p className="relative text-sm text-muted leading-[1.7] line-clamp-2">
        {category.desc}
      </p>
    </Link>
  );
}
