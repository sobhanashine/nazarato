import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { GLASS } from "@/components/ui/styles";
import { StarIcon } from "@/components/icons";
import { getSession } from "@/lib/auth/session";
import {
  getOwnedBusinesses,
  getOwnerInsights,
  type OwnedBusiness,
  type OwnerInsights,
  type RatingBar,
  type MonthlyPoint,
} from "@/lib/data/owner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "آمار و تحلیل — پنل کسب‌وکار | نظراتو",
  description: "توزیع امتیازها، روند نظرات و نرخ پاسخ‌گویی صفحه کسب‌وکار شما.",
  robots: { index: false },
};

type SearchParams = { b?: string };

const faNum = (n: number) => n.toLocaleString("fa-IR");
const faAvg = (n: number) =>
  n.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const faPct = (n: number) => `${n.toLocaleString("fa-IR")}٪`;

export default async function OwnerInsightsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Layout already guarantees a session + at least one owned business; we
  // re-read here because Next 16 doesn't share that boundary down the tree.
  const session = await getSession();
  if (!session) redirect("/login?next=/business/insights");

  const owned = await getOwnedBusinesses(session.id);
  if (owned.length === 0) redirect("/for-business");

  const { b: requestedSlug } = await searchParams;
  const active =
    (requestedSlug && owned.find((o) => o.slug === requestedSlug)) || owned[0];

  const insights = await getOwnerInsights(active.id);

  return (
    <main className="space-y-6">
      <Breadcrumb
        items={[
          { label: "خانه", href: "/" },
          { label: "پنل کسب‌وکار", href: "/business" },
          { label: "آمار و تحلیل" },
        ]}
      />

      <header className="space-y-2">
        <h1 className="text-[1.5rem] font-black text-strong sm:text-[1.85rem]">
          آمار و تحلیل «{active.name}»
        </h1>
        <p className="text-[0.9rem] leading-[1.9] text-muted">
          نگاهی به عملکرد صفحه‌ات بر پایه‌ی نظرات منتشرشده. آمار لحظه‌ای است و با
          هر نظر تازه به‌روز می‌شود.
        </p>
      </header>

      {owned.length > 1 ? (
        <BusinessSwitcher owned={owned} activeSlug={active.slug} />
      ) : null}

      {insights.totalReviews === 0 ? (
        <EmptyState slug={active.slug} />
      ) : (
        <>
          <StatGrid insights={insights} />
          <DistributionSection distribution={insights.distribution} />
          <TrendSection trend={insights.trend} />
          <p className="text-[0.8rem] text-muted">
            مجموع رأی‌های «مفید» دریافتی:{" "}
            <span className="font-bold text-strong">{faNum(insights.helpfulTotal)}</span>
          </p>
        </>
      )}
    </main>
  );
}

// ─── Sub-components (local — only this page uses them) ─────────────────────────

function BusinessSwitcher({
  owned,
  activeSlug,
}: {
  owned: OwnedBusiness[];
  activeSlug: string;
}) {
  return (
    <nav aria-label="انتخاب کسب‌وکار" className="flex flex-wrap gap-2">
      {owned.map((b) => {
        const active = b.slug === activeSlug;
        return (
          <Link
            key={b.id}
            href={`/business/insights?b=${encodeURIComponent(b.slug)}`}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.82rem] font-semibold transition-colors duration-200 ${
              active
                ? "border-mint/45 bg-mint/12 text-mint"
                : "border-glass-border bg-glass text-muted hover:text-strong"
            }`}
          >
            <span
              aria-hidden
              className="grid h-5 w-5 place-items-center rounded-full text-[0.65rem] font-black text-black"
              style={{ background: b.color }}
            >
              {b.initial}
            </span>
            {b.name}
          </Link>
        );
      })}
    </nav>
  );
}

type Accent = "mint" | "lapis" | "amber" | "muted";

const ACCENT: Record<Accent, string> = {
  mint: "border-mint/25 text-mint",
  lapis: "border-lapis/30 text-lapis",
  amber: "border-amber-400/30 text-amber-300",
  muted: "border-glass-border text-muted",
};

function StatGrid({ insights }: { insights: OwnerInsights }) {
  return (
    <section
      aria-label="آمار کلیدی"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
    >
      <StatTile
        label="میانگین امتیاز"
        value={faAvg(insights.avgRating)}
        hint="از ۵"
        accent="mint"
        icon={<StarIcon className="h-4 w-4" />}
      />
      <StatTile
        label="نظرات کل"
        value={faNum(insights.totalReviews)}
        hint="منتشرشده"
        accent="lapis"
      />
      <StatTile
        label="نرخ پاسخ‌گویی"
        value={faPct(insights.responseRate)}
        hint={`${faNum(insights.answeredCount)} پاسخ‌داده‌شده`}
        accent={insights.responseRate >= 50 ? "mint" : "amber"}
      />
      <StatTile
        label="نظرات تأییدشده"
        value={faPct(insights.verifiedRate)}
        hint={`${faNum(insights.verifiedCount)} با خرید تأییدشده`}
        accent="lapis"
      />
    </section>
  );
}

function StatTile({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  accent: Accent;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`${GLASS} flex h-full flex-col justify-between gap-3 p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.78rem] font-semibold text-muted">{label}</span>
        {icon ? (
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${ACCENT[accent]}`}
          >
            {icon}
          </span>
        ) : (
          <span
            className={`inline-block h-2 w-2 rounded-full ${ACCENT[accent]}`}
            aria-hidden
          />
        )}
      </div>
      <div>
        <div className={`text-[1.5rem] font-black sm:text-[1.75rem] ${ACCENT[accent]}`}>
          {value}
        </div>
        <div className="mt-0.5 text-[0.72rem] text-muted">{hint}</div>
      </div>
    </div>
  );
}

function DistributionSection({ distribution }: { distribution: RatingBar[] }) {
  return (
    <section aria-label="توزیع امتیازها" className="space-y-3">
      <h2 className="text-[1.1rem] font-black text-strong sm:text-[1.25rem]">
        توزیع امتیازها
      </h2>
      <div className={`${GLASS} space-y-3 p-4 sm:p-5`}>
        {distribution.map((bar) => (
          <div key={bar.rating} className="flex items-center gap-3">
            <span className="inline-flex w-12 shrink-0 items-center gap-1 text-[0.82rem] font-bold text-strong">
              {faNum(bar.rating)}
              <StarIcon className="h-3.5 w-3.5 text-mint" />
            </span>
            <div
              className="h-2.5 flex-1 overflow-hidden rounded-full bg-glass-border"
              role="progressbar"
              aria-valuenow={bar.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${faNum(bar.rating)} ستاره: ${faPct(bar.pct)}`}
            >
              <div
                className="h-full rounded-full bg-mint transition-[width] duration-500"
                style={{ width: `${bar.pct}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-end text-[0.78rem] text-muted">
              {faNum(bar.count)} ({faPct(bar.pct)})
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendSection({ trend }: { trend: MonthlyPoint[] }) {
  const max = Math.max(1, ...trend.map((p) => p.count));
  return (
    <section aria-label="روند نظرات" className="space-y-3">
      <h2 className="text-[1.1rem] font-black text-strong sm:text-[1.25rem]">
        روند نظرات <span className="text-[0.85rem] font-semibold text-muted">(۶ ماه اخیر)</span>
      </h2>
      <div className={`${GLASS} p-4 sm:p-5`}>
        <ul className="flex items-end justify-between gap-2 sm:gap-4">
          {trend.map((p) => (
            <li key={p.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[0.7rem] font-bold text-muted">
                {p.count > 0 ? faNum(p.count) : ""}
              </span>
              <div
                className="flex h-28 w-full items-end justify-center"
                title={
                  p.avgRating !== null
                    ? `${faNum(p.count)} نظر — میانگین ${faAvg(p.avgRating)}`
                    : "بدون نظر"
                }
              >
                <div
                  className={`w-full max-w-9 rounded-t-md transition-[height] duration-500 ${
                    p.count > 0 ? "bg-mint/70" : "bg-glass-border"
                  }`}
                  style={{
                    height: p.count > 0 ? `${Math.max(8, (p.count / max) * 100)}%` : "4px",
                  }}
                />
              </div>
              <span className="truncate text-[0.68rem] text-muted">{p.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function EmptyState({ slug }: { slug: string }) {
  return (
    <div className={`${GLASS} flex flex-col items-center gap-3 p-8 text-center`}>
      <span aria-hidden className="text-3xl">📊</span>
      <h3 className="text-[1rem] font-black text-strong">هنوز داده‌ای برای تحلیل نیست</h3>
      <p className="max-w-[42ch] text-[0.85rem] leading-[1.9] text-muted">
        وقتی اولین نظرها برای صفحه‌ات ثبت شوند، توزیع امتیازها و روند نظرات همین‌جا
        نمایش داده می‌شود.
      </p>
      <Link
        href={`/company/${slug}`}
        className="text-[0.85rem] font-semibold text-mint hover:underline"
      >
        مشاهده صفحه عمومی
      </Link>
    </div>
  );
}
