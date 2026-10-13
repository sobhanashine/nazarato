import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-glass-border pb-24 md:pb-0">
      <Container className="flex flex-col gap-6 py-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex min-h-11 items-center text-[22px] font-extrabold text-forest">نظراتو<span aria-hidden className="text-pomegr">.</span></Link>
          <p className="mt-2 text-[13px] leading-7 text-muted">تجربه‌ای که به انتخاب آدم‌ها و بهتر شدن کسب‌وکارها کمک کند؛ از کافه و رستوران‌های رشت شروع می‌کنیم.</p>
          <p className="mt-4 text-[12px] text-muted">© نظراتو</p>
        </div>
        <nav aria-label="پیوندهای پایانی" className="grid grid-cols-2 gap-x-8 gap-y-1 text-[13px] md:gap-x-12">
          {[
            { href: "/about", label: "مسیر نظراتو" },
            { href: "/for-business", label: "برای کسب‌وکارها" },
            { href: "/contact", label: "تماس و اصلاح اطلاعات" },
            { href: "/help", label: "راهنما" },
            { href: "/terms", label: "قوانین" },
            { href: "/privacy", label: "حریم خصوصی" },
          ].map(item => <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center text-muted hover:text-forest">{item.label}</Link>)}
        </nav>
      </Container>
    </footer>
  );
}
