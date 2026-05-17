import Link from "next/link";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NavLink } from "@/components/layout/NavLink";

const navItems = [
  { href: "/blog", label: "بلاگ" },
  { href: "/categories", label: "دسته‌بندی‌ها" },
  { href: "/login", label: "ورود" },
];

export function Header() {
  return (
    <header className="site-header">
      <div className="header-bar">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="نظراتو">
            <span className="brand-mark" aria-hidden="true">ن</span>
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
            <Link href="/business" className="btn-biz">برای کمپانی‌ها</Link>
            <MobileMenu items={navItems} />
          </div>
        </div>
      </div>
    </header>
  );
}
