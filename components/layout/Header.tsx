import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="header-bar">
        <div className="container header-inner">
          <Link href="/" className="logo-link" aria-label="نظراتو">
            <Image src="/favicon.webp" alt="نظراتو" width={48} height={48} />
          </Link>
          <nav className="site-nav">
            <ul>
              <li><Link href="/business" className="btn-biz">برای کمپانی‌ها</Link></li>
              <li className="nav-item-text"><Link href="/blog">بلاگ</Link></li>
              <li className="nav-item-text"><Link href="/categories">دسته‌بندی‌ها</Link></li>
              <li className="nav-item-text"><Link href="/login">ورود</Link></li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
