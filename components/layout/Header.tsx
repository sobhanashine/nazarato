import Link from "next/link";
import { HeaderAuth } from "@/components/layout/HeaderAuth";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NavLink } from "@/components/layout/NavLink";
import { Container } from "@/components/ui/Container";

// Desktop top-nav — kept short to fit the pill.
const navItems = [
  { href: "/blog", label: "بلاگ" },
  { href: "/categories", label: "دسته‌بندی‌ها" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

// Mobile hamburger menu — has room for every primary page, so it also
// surfaces جستجو and نوشتن نظر (which desktop reaches via the hero / tab bar).
const mobileNavItems = [
  { href: "/search", label: "جستجو" },
  { href: "/write-review", label: "نوشتن نظر" },
  ...navItems,
];

const brandMark =
  "[filter:drop-shadow(0_6px_16px_rgba(91,230,178,0.45))] [&_svg]:w-full [&_svg]:h-full [&_svg]:block";

export function Header() {
  return (
    <header className="sticky top-0 z-[100] h-[72px] sm:h-20 bg-[rgba(8,11,20,0.55)] backdrop-blur-[22px] backdrop-saturate-[180%] not-supports-[backdrop-filter]:bg-[rgba(8,11,20,0.92)] border-b border-glass-border shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_30px_rgba(0,0,0,0.35)] standalone:h-[calc(72px+env(safe-area-inset-top)+16px)] standalone:pt-[calc(env(safe-area-inset-top)+16px)] standalone:sm:h-[calc(80px+env(safe-area-inset-top)+16px)]">
      <div className="w-full h-[72px] sm:h-20 flex items-center">
        <Container className="flex flex-row justify-between items-center gap-4 h-full">
          <Link
            href="/"
            aria-label="نظراتو"
            className="inline-flex items-center gap-2.5 text-strong shrink-0 py-2 min-h-11"
          >
            <span
              className={`${brandMark} hidden md:inline-block w-[38px] h-[38px]`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="brandGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#5BE6B2" />
                    <stop offset="1" stopColor="#7B89FF" />
                  </linearGradient>
                </defs>
                <path
                  d="M8 6h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H17l-6 5a1 1 0 0 1-1.6-.8V30H8a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Z"
                  fill="url(#brandGrad)"
                />
                <path
                  d="M20 12.2l2.18 4.42 4.88.71-3.53 3.44.83 4.86L20 23.34l-4.36 2.29.83-4.86-3.53-3.44 4.88-.71L20 12.2Z"
                  fill="#06231b"
                />
              </svg>
            </span>
            <span className="text-[1.18rem] font-extrabold text-strong -tracking-[0.02em]">
              نظراتو
            </span>
          </Link>

          <nav aria-label="ناوبری اصلی" className="hidden md:block">
            <ul className="flex items-center gap-2 list-none py-0 px-3 bg-glass border border-glass-border rounded-full backdrop-blur-[14px] backdrop-saturate-[160%]">
              {navItems.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <HeaderAuth />
            <MobileMenu items={mobileNavItems} />
          </div>
        </Container>
      </div>
    </header>
  );
}
