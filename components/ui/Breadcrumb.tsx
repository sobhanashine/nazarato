import { Fragment, type ReactNode } from "react";
import Link from "next/link";

export type BreadcrumbItem = { label: ReactNode; href?: string };

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={i}>
            {item.href && !isLast ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span className={isLast ? "current" : undefined}>{item.label}</span>
            )}
            {!isLast && <span className="sep">/</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
