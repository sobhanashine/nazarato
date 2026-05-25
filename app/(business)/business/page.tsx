import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";
import { StarIcon } from "@/components/icons";
import { getSession } from "@/lib/auth/session";
import {
  getOwnedBusinesses,
  getOwnerKpis,
  getRecentReviewsForOwner,
  type OwnedBusiness,
  type OwnerReviewPreview,
} from "@/lib/data/owner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "نمای کلی — پنل کسب‌وکار | نظراتو",
  description: "خلاصه عملکرد صفحه کسب‌وکار شما در نظراتو.",
  robots: { index: false },
};

type SearchParams = { b?: string };

const faNum = (n: number) => n.toLocaleString("fa-IR");
const faAvg = (n: number) =>
  n.toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Layout already guarantees `session` and at least one owned business; we
  // re-read here because Next 16 doesn't share that boundary across the
  // server/page tree, and the data is cheap.
  const session = await getSession();
  if (!session) redirect("/login?next=/business");

  const owned = await getOwnedBusinesses(session.id);
  if (owned.length === 0) redirect("/for-business");

  const { b: requestedSlug } = await searchParams;
  const active =
    (requestedSlug && owned.find((o) => o.slug === requestedSlug)) || owned[0];

  const [kpis, recentReviews] = await Promise.all([
    getOwnerKpis(active.id),
    getRecentReviewsForOwner(active.id, 5),
  ]);

  return (
    <main className="space-y-6">
      <Breadcrumb
        items={[
          { label: "خانه", href: "/" },
          { label: "پنل کسب‌وکار" },
        ]}
      />

      <header className="space-y-2">
        <h1 className="text-[1.6rem] font-black text-strong sm:text-[1.9rem]">
          سلام، {session.name}
        </h1>
        <p className="text-[0.9rem] leading-[1.9] text-muted">
          خلاصه‌ای از فعالیت صفحه‌ی{" "}
          <Link href={`/company/${active.slug}`} className="text-mint hover:underline">
            «{active.name}»
          </Link>{" "}
          در نظراتو.
        </p>
      </header>

      {owned.length > 1 ? <BusinessSwitcher owned={owned} activeSlug={active.slug} /> : null}

      <section aria-label="آمار کلی" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiTile
          label="میانگین امتیاز"
          value={kpis.totalReviews > 0 ? faAvg(kpis.avgRating) : "—"}
          hint={kpis.totalReviews > 0 ? "از ۵" : "هنوز نظری نیست"}
          accent="mint"
          icon={<StarIcon className="h-4 w-4" />}
          href={`/company/${active.slug}/reviews`}
        />
        <KpiTile
          label="نظرات کل"
          value={faNum(kpis.totalReviews)}
          hint="منتشرشده"
          accent="lapis"
          href={`/company/${active.slug}/reviews`}
        />
        <KpiTile
          label="جدید این هفته"
          value={faNum(kpis.newThisWeek)}
          hint="۷ روز گذشته"
          accent="mint"
        />
        <KpiTile
          label="بدون پاسخ"
          value={faNum(kpis.unansweredCount)}
          hint={kpis.unansweredCount > 0 ? "نیازمند پاسخ" : "همه پاسخ‌داده‌شده"}
          accent={kpis.unansweredCount > 0 ? "amber" : "muted"}
        />
      </section>

      <section aria-label="آخرین نظرات" className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[1.1rem] font-black text-strong sm:text-[1.25rem]">
            ۵ نظر اخیر
          </h2>
          <Link
            href={`/company/${active.slug}/reviews`}
            className="text-[0.85rem] font-semibold text-mint hover:underline"
          >
            مشاهده همه
          </Link>
        </div>

        {recentReviews.length === 0 ? (
          <EmptyState slug={active.slug} />
        ) : (
          <ul className="space-y-3">
            {recentReviews.map((r) => (
              <ReviewRow key={r.id} review={r} slug={active.slug} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// ─── Sub-components (kept local — only this page uses them) ────────────────

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
            href={`/business?b=${encodeURIComponent(b.slug)}`}
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

function KpiTile({
  label,
  value,
  hint,
  accent,
  icon,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  accent: Accent;
  icon?: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <div className={`${GLASS} flex h-full flex-col justify-between gap-3 p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.78rem] font-semibold text-muted">{label}</span>
        {icon ? (
          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${ACCENT[accent]}`}>
            {icon}
          </span>
        ) : (
          <span className={`inline-block h-2 w-2 rounded-full ${ACCENT[accent]}`} aria-hidden />
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

  return href ? (
    <Link href={href} className="block h-full transition-transform duration-200 hover:-translate-y-px">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function ReviewRow({
  review,
  slug,
}: {
  review: OwnerReviewPreview;
  slug: string;
}) {
  return (
    <li className={`${GLASS} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[0.85rem] font-black text-black"
            style={{ background: review.author.color }}
          >
            {review.author.initial}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[0.92rem] font-bold text-strong">
              {review.author.name}
            </div>
            <div className="text-[0.72rem] text-muted">{review.createdAtLabel}</div>
          </div>
        </div>
        <RatingBadge rating={review.rating} />
      </div>

      <p className="mt-3 line-clamp-3 text-[0.9rem] leading-[1.9] text-strong">
        {review.body}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        {review.hasOwnerResponse ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-[0.7rem] font-bold text-mint">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            پاسخ داده‌شده
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[0.7rem] font-bold text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            بدون پاسخ
          </span>
        )}
        <Link
          href={`/company/${slug}/reviews#review-${review.id}`}
          className={`${BTN_PRIMARY} px-3.5 py-1.5 text-[0.78rem]`}
          aria-label={`پاسخ به نظر ${review.author.name}`}
        >
          پاسخ
        </Link>
      </div>
    </li>
  );
}

function RatingBadge({ rating }: { rating: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-mint/30 bg-mint/10 px-2 py-1 text-[0.75rem] font-bold text-mint"
      aria-label={`امتیاز ${rating} از ۵`}
    >
      <StarIcon className="h-3 w-3" />
      {faNum(rating)}
    </span>
  );
}

function EmptyState({ slug }: { slug: string }) {
  return (
    <div className={`${GLASS} flex flex-col items-center gap-3 p-8 text-center`}>
      <span aria-hidden className="text-3xl">📝</span>
      <h3 className="text-[1rem] font-black text-strong">هنوز نظری ثبت نشده</h3>
      <p className="max-w-[40ch] text-[0.85rem] leading-[1.9] text-muted">
        وقتی اولین نظر برای صفحه‌ات ثبت شود، همین‌جا می‌بینی و می‌توانی پاسخ بدهی.
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
