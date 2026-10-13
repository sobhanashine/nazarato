import { Fragment, type ReactNode } from "react";
import Link from "next/link";

export type BreadcrumbItem = { label: ReactNode; href?: string };

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="my-3 flex flex-wrap items-center gap-x-2 text-sm" aria-label="مسیر صفحه">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={i}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center text-muted transition-colors duration-200 hover:text-mint"
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
