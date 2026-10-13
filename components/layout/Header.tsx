import Link from "next/link";
import { HeaderAuth } from "@/components/layout/HeaderAuth";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NavLink } from "@/components/layout/NavLink";
import { Container } from "@/components/ui/Container";

const navItems = [
  { href: "/", label: "کشف" },
  { href: "/search", label: "جستجو" },
  { href: "/nabz", label: "نبض رشت" },
  { href: "/about", label: "مسیر نظراتو" },
];
const mobileNavItems = [
  ...navItems,
  { href: "/for-business", label: "برای صاحب کسب‌وکار" },
  { href: "/contact", label: "پیشنهاد و اصلاح اطلاعات" },
  { href: "/help", label: "راهنما" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-[100] border-b border-glass-border bg-canvas standalone:pt-[env(safe-area-inset-top)]">
      <Container className="flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" aria-label="نظراتو، صفحهٔ اول" className="inline-flex min-h-11 items-center gap-3 text-forest">
          <span className="text-[24px] font-extrabold leading-none">نظراتو<span aria-hidden className="text-pomegr">.</span></span>
          <span className="hidden border-s border-glass-border ps-3 text-[12px] font-medium text-muted sm:inline">از رشت شروع می‌کنیم</span>
        </Link>
        <nav aria-label="ناوبری اصلی" className="hidden md:block">
          <ul className="flex items-center gap-3">
            {navItems.map(item => <li key={item.href}><NavLink href={item.href}>{item.label}</NavLink></li>)}
          </ul>
        </nav>
        <div className="flex items-center gap-3"><HeaderAuth /><MobileMenu items={mobileNavItems} /></div>
      </Container>
    </header>
  );
}
