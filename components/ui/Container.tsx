import type { ReactNode } from "react";
import { CONTAINER } from "./styles";

/** Centered, gutter-padded page column. Replaces the former `.container` class. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className ? `${CONTAINER} ${className}` : CONTAINER}>
      {children}
    </div>
  );
}
