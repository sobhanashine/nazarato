import Link from "next/link";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NavLink } from "@/components/layout/NavLink";

const navItems = [
  { href: "/blog", label: "بلاگ" },
  { href: "/categories", label: "دسته‌بندی‌ها" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

export function Header() {
  return (
    <header className="site-header">
      <div className="header-bar">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="نظراتو">
            <span className="brand-mark" aria-hidden="true">
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
            <span className="brand-word">نظراتو</span>
          </Link>

          <nav className="site-nav" aria-label="ناوبری اصلی">
            <ul>
              {navItems.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            <Link href="/login" className="btn-biz">ورود</Link>
            <MobileMenu items={navItems} />
          </div>
        </div>
      </div>
    </header>
  );
}
