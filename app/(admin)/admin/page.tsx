import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { GLASS } from "@/components/ui/styles";
import { getAdminOverview } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

const faNum = (n: number) => n.toLocaleString("fa-IR");

type Tile = {
  href: string;
  label: string;
  count: number;
  hint: string;
  /** Highlight when there's something waiting. */
  urgent: boolean;
};

// Auth + admin-role gate lives in app/(admin)/layout.tsx.
export default async function AdminOverviewPage() {
  const o = await getAdminOverview();

  const tiles: Tile[] = [
    {
      href: "/admin/moderation",
      label: "نظرات در انتظار تأیید",
      count: o.pendingReviews,
      hint: "بررسی و انتشار",
      urgent: o.pendingReviews > 0,
    },
    {
      href: "/admin/reports",
      label: "نظرات گزارش‌شده",
      count: o.reportedReviews,
      hint: "رسیدگی به گزارش‌ها",
      urgent: o.reportedReviews > 0,
    },
    {
      href: "/admin/claims",
      label: "درخواست‌های مالکیت",
      count: o.pendingClaims,
      hint: "تأیید مالکیت کسب‌وکار",
      urgent: o.pendingClaims > 0,
    },
    {
      href: "/admin/businesses",
      label: "کسب‌وکارهای جدید",
      count: o.newBusinesses,
      hint: "۷ روز اخیر",
      urgent: false,
    },
  ];

  return (
    <>
      <Header />
      <Container>
        <main className="space-y-6 py-8">
          <header className="space-y-1">
            <h1 className="text-[1.7rem] font-black text-strong">پنل مدیریت</h1>
            <p className="text-[0.85rem] text-muted">نمای کلی و دسترسی سریع</p>
          </header>

          <section
            aria-label="آمار کلیدی"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
          >
            {tiles.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`${GLASS} flex flex-col justify-between gap-4 p-5 transition-colors hover:border-mint/40 ${
                  t.urgent ? "border-mint/30" : ""
                }`}
              >
                <span className="text-[0.82rem] font-semibold text-muted">
                  {t.label}
                </span>
                <div>
                  <div
                    className={`text-[2rem] font-black ${t.urgent ? "text-mint" : "text-strong"}`}
                  >
                    {faNum(t.count)}
                  </div>
                  <div className="mt-0.5 text-[0.72rem] text-muted">{t.hint}</div>
                </div>
              </Link>
            ))}
          </section>

          <nav aria-label="بخش‌های مدیریت" className="flex flex-wrap gap-2">
            {[
              { href: "/admin/users", label: "کاربران" },
              { href: "/admin/businesses", label: "کسب‌وکارها" },
              { href: "/admin/moderation", label: "صف بررسی نظرات" },
              { href: "/admin/reports", label: "گزارش‌ها" },
              { href: "/admin/claims", label: "مالکیت‌ها" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border border-glass-border bg-glass px-4 py-2 text-[0.82rem] font-semibold text-muted transition-colors hover:border-mint/40 hover:text-mint"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </main>
      </Container>
      <Footer />
    </>
  );
}
