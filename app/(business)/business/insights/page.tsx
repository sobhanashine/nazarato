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
import {
  ASPECT_LABELS,
  ISSUE_CLUSTER_LABELS,
  type SupportedInsight,
} from "@/lib/data/owner-action-insights";
import {
  getOwnerDecisionWorkspace,
  type OwnerDecisionWorkspace,
  type OwnerImprovementAction,
} from "@/lib/data/owner-decision-workspace";
import { OwnerDecisionControls } from "./OwnerDecisionControls";

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

  const [insights, decisionWorkspace] = await Promise.all([
    getOwnerInsights(active.id),
    getOwnerDecisionWorkspace(active.id),
  ]);

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
          از صدای مشتری تا یک تصمیم مشخص؛ هر نتیجه با شاهد، سطح اطمینان و امکان
          اصلاح انسانی نمایش داده می‌شود.
        </p>
      </header>

      {owned.length > 1 ? (
        <BusinessSwitcher owned={owned} activeSlug={active.slug} />
      ) : null}

      {insights.totalReviews === 0 ? (
        <EmptyState slug={active.slug} />
      ) : (
        <>
          <DecisionWorkspace
            businessId={active.id}
            businessSlug={active.slug}
            workspace={decisionWorkspace}
          />
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

function DecisionWorkspace({
  businessId,
  businessSlug,
  workspace,
}: {
  businessId: string;
  businessSlug: string;
  workspace: OwnerDecisionWorkspace;
}) {
  const { insights } = workspace;

  return (
    <section aria-labelledby="decision-workspace-title" className="space-y-4">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-mint/25 bg-[linear-gradient(135deg,rgba(37,244,177,0.12),rgba(16,24,31,0.72)_45%,rgba(67,108,255,0.1))] p-5 sm:p-7">
        <div
          aria-hidden
          className="absolute -end-16 -top-20 h-52 w-52 rounded-full border border-mint/15"
        />
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-[0.68rem] font-black text-mint">
                یادداشت تصمیم زنده
              </span>
              <span className="rounded-full border border-glass-border bg-black/20 px-3 py-1 text-[0.68rem] text-muted">
                مدل {workspace.reviews[0]?.analysis.modelVersion ?? "—"}
              </span>
            </div>
            <h2
              id="decision-workspace-title"
              className="max-w-[22ch] text-[1.25rem] font-black leading-[1.55] text-strong sm:text-[1.6rem]"
            >
              اول شواهد، بعد تصمیم؛ بعد هم اندازه‌گیری تغییر
            </h2>
            <p className="mt-2 max-w-[62ch] text-[0.82rem] leading-[1.95] text-muted">
              فقط الگوهایی نتیجه محسوب می‌شوند که حداقل {faNum(insights.threshold.minimumReviews)} نظر مستقل و اطمینان کافی داشته باشند. بقیه صریحاً نگه داشته می‌شوند تا داده بیشتری برسد.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <DecisionMetric label="تحلیل‌شده" value={insights.analyzedReviewCount} />
            <DecisionMetric label="تأییدشده" value={insights.strengths.length + insights.issues.length} />
            <DecisionMetric label="اصلاح مالک" value={insights.correctedReviewCount} />
          </div>
        </div>
      </div>

      {!workspace.evidenceStoreAvailable || workspace.livePreviewCount > 0 ? (
        <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.055] px-4 py-3 text-[0.75rem] leading-[1.8] text-amber-100">
          {workspace.livePreviewCount > 0
            ? `${faNum(workspace.livePreviewCount)} تحلیل در حالت پیش‌نمایش زنده است و هنوز در دیتابیس نسخه‌دار نشده؛ `
            : "دسترسی به تاریخچه تحلیل‌ها و اصلاح‌های انسانی کامل نیست؛ "}
          نتیجه قابل مشاهده است اما تا فعال‌شدن لایه ذخیره‌سازی برای ارزیابی رسمی پایلوت شمرده نمی‌شود.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightColumn
          title="مسئله‌های تکرارشونده"
          eyebrow="جایی که ارزش اقدام دارد"
          empty="هنوز مسئله‌ای با سه شاهد مستقل نداریم."
          insights={insights.issues}
          businessSlug={businessSlug}
          tone="issue"
        />
        <InsightColumn
          title="نقطه‌های قوت پایدار"
          eyebrow="چیزی که باید حفظ شود"
          empty="هنوز نقطه قوتی با سه شاهد مستقل نداریم."
          insights={insights.strengths}
          businessSlug={businessSlug}
          tone="strength"
        />
      </div>

      {insights.withheld.length > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-glass-border bg-black/15 p-4">
          <span aria-hidden className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-glass-border text-[0.8rem] text-muted">؟</span>
          <p className="text-[0.76rem] leading-[1.85] text-muted">
            {faNum(insights.withheld.length)} الگوی اولیه عمداً نمایش داده نشده؛ یا کمتر از سه نظر مستقل دارد یا سطح اطمینان آن پایین است. این بخش حدس را به توصیه تبدیل نمی‌کند.
          </p>
        </div>
      ) : null}

      {workspace.activeAction ? (
        <ActiveActionCard action={workspace.activeAction} />
      ) : null}

      <OwnerDecisionControls
        businessId={businessId}
        correctionChoices={workspace.correctionChoices}
        supportedIssues={insights.issues}
        actionStoreAvailable={workspace.actionStoreAvailable}
        hasActiveAction={Boolean(workspace.activeAction)}
        hasUnversionedEvidence={
          !workspace.evidenceStoreAvailable || workspace.livePreviewCount > 0
        }
      />
    </section>
  );
}

function DecisionMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 backdrop-blur-sm">
      <div className="text-[1.2rem] font-black text-strong">{faNum(value)}</div>
      <div className="mt-0.5 text-[0.64rem] text-muted">{label}</div>
    </div>
  );
}

function InsightColumn({
  title,
  eyebrow,
  empty,
  insights,
  businessSlug,
  tone,
}: {
  title: string;
  eyebrow: string;
  empty: string;
  insights: SupportedInsight[];
  businessSlug: string;
  tone: "issue" | "strength";
}) {
  return (
    <div className={`${GLASS} p-4 sm:p-5`}>
      <p className={`text-[0.66rem] font-black tracking-[0.12em] ${tone === "issue" ? "text-amber-300" : "text-mint"}`}>
        {eyebrow}
      </p>
      <h3 className="mt-1.5 text-[1rem] font-black text-strong">{title}</h3>
      {insights.length === 0 ? (
        <p className="mt-4 rounded-xl border border-glass-border bg-black/10 p-3 text-[0.76rem] leading-[1.8] text-muted">
          {empty}
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {insights.slice(0, 3).map((insight, index) => (
            <li key={`${insight.aspect}:${insight.issueCluster ?? "none"}`} className="rounded-2xl border border-glass-border bg-black/15 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[0.65rem] font-bold text-muted">رتبه {faNum(index + 1)}</span>
                  <h4 className="mt-0.5 text-[0.9rem] font-black text-strong">
                    {tone === "issue" && insight.issueCluster
                      ? ISSUE_CLUSTER_LABELS[insight.issueCluster]
                      : ASPECT_LABELS[insight.aspect]}
                  </h4>
                </div>
                <div className="shrink-0 text-end">
                  <div className="text-[0.8rem] font-black text-strong">{faNum(insight.reviewCount)} شاهد</div>
                  <div className="text-[0.63rem] text-muted">اطمینان {faPct(Math.round(insight.confidence * 100))}</div>
                </div>
              </div>
              <div className="mt-3 space-y-2 border-t border-glass-border pt-3">
                {insight.citations.map((citation) => (
                  <blockquote key={citation.reviewId} className="text-[0.73rem] leading-[1.75] text-muted">
                    «{citation.excerpt}»{" "}
                    <Link
                      href={`/company/${businessSlug}/reviews#review-${citation.reviewId}`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center whitespace-nowrap px-1 align-middle font-bold text-lapis hover:underline"
                    >
                      منبع ↗
                    </Link>
                  </blockquote>
                ))}
              </div>
              {insight.source === "owner_corrected" ? (
                <span className="mt-3 inline-flex rounded-full border border-lapis/25 bg-lapis/10 px-2.5 py-1 text-[0.62rem] font-bold text-lapis">
                  با اصلاح مالک
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ActiveActionCard({ action }: { action: OwnerImprovementAction }) {
  const before = Math.round(action.baselineNegativeRate * 100);
  const target = Math.round(action.targetNegativeRate * 100);
  return (
    <article className="overflow-hidden rounded-3xl border border-mint/30 bg-mint/[0.055]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-mint/15 px-5 py-4 sm:px-6">
        <div>
          <span className="text-[0.66rem] font-black tracking-[0.12em] text-mint">اقدام فعال</span>
          <h3 className="mt-1 text-[1.05rem] font-black text-strong">{action.title}</h3>
        </div>
        <span className="rounded-full border border-mint/25 bg-mint/10 px-3 py-1 text-[0.68rem] font-bold text-mint">
          سنجش: {new Date(`${action.followUpDate}T12:00:00Z`).toLocaleDateString("fa-IR")}
        </span>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:px-6">
        <ActionMeasure label="قبل" value={faPct(before)} hint={`${faNum(action.baselineNegativeMentions)} از ${faNum(action.baselineReviewCount)} نظر`} />
        <span aria-hidden className="hidden text-xl text-mint sm:block">←</span>
        <ActionMeasure label="هدف بعدی" value={`≤ ${faPct(target)}`} hint={`کاهش ${faPct(action.targetReductionPct)}`} />
      </div>
      <p className="border-t border-mint/15 px-5 py-3 text-[0.68rem] leading-[1.7] text-muted sm:px-6">
        موضوع: {ASPECT_LABELS[action.targetAspect]} · بازه پایه {new Date(`${action.baselineWindowStart}T12:00:00Z`).toLocaleDateString("fa-IR")} تا {new Date(`${action.baselineWindowEnd}T12:00:00Z`).toLocaleDateString("fa-IR")} · مدل {action.modelVersion}
      </p>
    </article>
  );
}

function ActionMeasure({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-glass-border bg-black/15 p-4 text-center">
      <div className="text-[0.68rem] font-bold text-muted">{label}</div>
      <div className="mt-1 text-[1.45rem] font-black text-strong">{value}</div>
      <div className="mt-0.5 text-[0.67rem] text-muted">{hint}</div>
    </div>
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
