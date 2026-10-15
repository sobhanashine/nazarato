import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleChevronLeftIcon,
  DoubleChevronRightIcon,
} from "@/components/icons";

const pageBtn =
  "w-10 h-10 rounded-full inline-flex items-center justify-center text-[0.95rem] tabular-nums " +
  "border bg-glass backdrop-blur-[10px] transition-all duration-200 " +
  "[&_svg]:w-3.5 [&_svg]:h-3.5";

const pageBtnIdle =
  "border-glass-border text-strong hover:border-mint/50 hover:text-mint hover:bg-glass-hover";

const pageBtnDisabled = "opacity-40 pointer-events-none cursor-not-allowed";

const pageBtnActive =
  "border-transparent font-bold text-[#06231b] bg-[linear-gradient(135deg,#5BE6B2_0%,#3FBF92_100%)] " +
  "shadow-[0_6px_18px_-4px_rgba(91,230,178,0.55),inset_0_1px_0_rgba(255,255,255,0.45)]";

/**
 * URL-driven pagination. Generates Links keyed off `basePath` and the page
 * number; the active page is rendered as a span (no Link) so it's not
 * clickable. The server component reading `?page=N` decides what to show —
 * this component only handles navigation.
 *
 * `basePath` must be the URL path *without* the page query (e.g. `/blog`
 * or `/blog/category/فناوری`). Page 1 is rendered without `?page=1` to
 * keep canonical URLs clean.
 */
export function Pagination({
  totalPages,
  currentPage,
  basePath,
}: {
  totalPages: number;
  currentPage: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const page = Math.min(Math.max(1, currentPage), totalPages);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const hrefFor = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-10 md:gap-3"
      aria-label="ناوبری صفحات"
    >
      <NavLink
        href={hrefFor(1)}
        disabled={page === 1}
        ariaLabel="اول"
      >
        <DoubleChevronRightIcon />
      </NavLink>
      <NavLink
        href={hrefFor(page - 1)}
        disabled={page === 1}
        ariaLabel="قبلی"
      >
        <ChevronRightIcon />
      </NavLink>
      {pages.map((p) =>
        p === page ? (
          <span
            key={p}
            className={`${pageBtn} ${pageBtnActive}`}
            aria-current="page"
          >
            {p.toLocaleString("fa-IR")}
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            className={`${pageBtn} ${pageBtnIdle}`}
          >
            {p.toLocaleString("fa-IR")}
          </Link>
        ),
      )}
      <NavLink
        href={hrefFor(page + 1)}
        disabled={page === totalPages}
        ariaLabel="بعدی"
      >
        <ChevronLeftIcon />
      </NavLink>
      <NavLink
        href={hrefFor(totalPages)}
        disabled={page === totalPages}
        ariaLabel="آخر"
      >
        <DoubleChevronLeftIcon />
      </NavLink>
    </nav>
  );
}

function NavLink({
  href,
  disabled,
  ariaLabel,
  children,
}: {
  href: string;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        className={`${pageBtn} ${pageBtnIdle} ${pageBtnDisabled}`}
        aria-disabled="true"
        aria-label={ariaLabel}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`${pageBtn} ${pageBtnIdle}`}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}
