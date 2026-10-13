import Link from "next/link";
import { GLASS } from "@/components/ui/styles";
import type { Category } from "@/lib/data/categories";

export function CategoryCard({
  category,
  compact = false,
}: {
  category: Category;
  compact?: boolean;
}) {
  return (
    <Link
      href={category.href}
      className={`${GLASS} group flex h-full min-h-11 items-start gap-4 p-5 transition-colors hover:border-mint focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint sm:p-6`}
    >
      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mint/8 text-mint [&_svg]:h-6 [&_svg]:w-6">
        {category.icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold leading-7 text-strong">{category.title}</h3>
        {!compact && <p className="mt-2 text-sm leading-7 text-muted">{category.desc}</p>}
      </div>
      <span aria-hidden="true" className="pt-1 text-lg text-mint">←</span>
    </Link>
  );
}
