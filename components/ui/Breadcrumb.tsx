import { Fragment, type ReactNode } from "react";
import Link from "next/link";

export type BreadcrumbItem = { label: ReactNode; href?: string };

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 my-6 text-sm" aria-label="breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={i}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-muted transition-colors duration-200 hover:text-mint"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-mint" : "text-muted"}>{item.label}</span>
            )}
            {!isLast && (
              <span className="text-muted opacity-50 flex items-center">/</span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
