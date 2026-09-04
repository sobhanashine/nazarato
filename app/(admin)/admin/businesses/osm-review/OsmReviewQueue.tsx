"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { GLASS } from "@/components/ui/styles";
import {
  filterOsmReviewCandidates,
  summarizeOsmReviewCandidates,
  type OsmReviewCandidate,
  type OsmReviewCategory,
  type OsmReviewCompleteness,
} from "@/lib/admin/osm-review";

const faNum = (value: number) => value.toLocaleString("fa-IR");

const CATEGORY_LABELS: Record<OsmReviewCategory, string> = {
  cafe: "کافه",
  restaurant: "رستوران",
};

function formatCapturedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "نامشخص";
  return date.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function CompletenessMeter({ candidate }: { candidate: OsmReviewCandidate }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[0.68rem]">
        <span className="font-bold text-muted">کامل‌بودن اطلاعات</span>
        <span className="font-black text-strong">
          {faNum(candidate.completenessScore)} از {faNum(candidate.completenessTotal)}
        </span>
      </div>
      <div
        className="mt-2 grid grid-cols-4 gap-1"
        aria-label={`کامل‌بودن اطلاعات: ${candidate.completenessScore} از ${candidate.completenessTotal}`}
      >
        {Array.from({ length: candidate.completenessTotal }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full ${
              index < candidate.completenessScore ? "bg-mint" : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: OsmReviewCandidate }) {
  return (
    <article
      className={`${GLASS} flex min-w-0 flex-col overflow-hidden border-white/[0.08] bg-[linear-gradient(160deg,rgba(18,33,30,0.8),rgba(7,10,18,0.92))] p-3.5 sm:p-5`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-mint/25 bg-mint/[0.08] px-2.5 py-1 text-[0.65rem] font-black text-mint">
          {CATEGORY_LABELS[candidate.category]}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold text-[#f4c66b]">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#f4c66b]" />
          خصوصی · در انتظار
        </span>
      </div>

      <h2 className="mt-3 line-clamp-2 min-h-12 text-[0.92rem] font-black leading-6 text-strong sm:text-base">
        {candidate.name}
      </h2>
      <p className="mt-1 truncate text-[0.62rem] text-white/35" dir="ltr">
        {candidate.slug}
      </p>

      <div className="my-4 border-t border-dashed border-white/[0.09]" />
      <CompletenessMeter candidate={candidate} />

      {candidate.missingFields.length > 0 ? (
        <p className="mt-3 line-clamp-2 text-[0.66rem] leading-5 text-[#d7a753]">
          ناقص: {candidate.missingFields.join("، ")}
        </p>
      ) : (
        <p className="mt-3 text-[0.66rem] font-bold text-mint">چهار فیلد اصلی موجود است</p>
      )}

      <details className="group mt-4 border-t border-white/[0.08] pt-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-[0.72rem] font-bold text-muted outline-none transition-colors hover:text-strong focus-visible:text-mint [&::-webkit-details-marker]:hidden">
          <span>جزئیات و شناسنامه</span>
          <span aria-hidden className="text-base transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="space-y-3 pb-1 pt-2 text-[0.68rem] leading-5 text-muted">
          <dl className="space-y-2">
            {candidate.contact.phone && (
              <div>
                <dt className="text-white/35">تلفن</dt>
                <dd className="break-all text-strong" dir="ltr">
                  {candidate.contact.phone}
                </dd>
              </div>
            )}
            {candidate.contact.address && (
              <div>
                <dt className="text-white/35">نشانی منبع</dt>
                <dd className="text-strong">{candidate.contact.address}</dd>
              </div>
            )}
            {candidate.contact.instagram && (
              <div>
                <dt className="text-white/35">اینستاگرام</dt>
                <dd className="break-all text-strong" dir="ltr">
                  @{candidate.contact.instagram.replace(/^@/, "")}
                </dd>
              </div>
            )}
            {candidate.contact.website && (
              <div>
                <dt className="text-white/35">وب‌سایت ثبت‌شده</dt>
                <dd className="break-all text-strong" dir="ltr">
                  {candidate.contact.website}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-white/35">مختصات</dt>
              <dd className="text-strong" dir="ltr">
                {candidate.latitude ?? "—"}, {candidate.longitude ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-white/35">تاریخ برداشت</dt>
              <dd className="text-strong">{formatCapturedAt(candidate.capturedAt)}</dd>
            </div>
          </dl>

          {candidate.sourceWarning ? (
            <p className="rounded-xl border border-pomegr/25 bg-pomegr/[0.08] p-2.5 text-pomegr">
              {candidate.sourceWarning}؛ هیچ لینکی نمایش داده نشد.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <a
                href={candidate.sourceUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full border border-mint/30 px-3 font-bold text-mint transition-colors hover:bg-mint/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              >
                مشاهده در OSM
              </a>
              <a
                href={candidate.licenseUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full border border-lapis/30 px-3 font-bold text-[#aeb7ff] transition-colors hover:bg-lapis/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
              >
                مجوز {candidate.licenseName}
              </a>
            </div>
          )}
        </div>
      </details>
    </article>
  );
}

export function OsmReviewQueue({
  initialCandidates,
}: {
  initialCandidates: OsmReviewCandidate[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | OsmReviewCategory>("all");
  const [completeness, setCompleteness] =
    useState<OsmReviewCompleteness>("all");
  const summary = useMemo(
    () => summarizeOsmReviewCandidates(initialCandidates),
    [initialCandidates],
  );
  const visibleCandidates = useMemo(
    () =>
      filterOsmReviewCandidates(initialCandidates, {
        query,
        category,
        completeness,
      }),
    [category, completeness, initialCandidates, query],
  );

  return (
    <>
      <Header />
      <Container>
        <main className="min-h-[70vh] space-y-6 py-8">
          <header className="relative overflow-hidden rounded-[1.75rem] border border-mint/20 bg-[linear-gradient(125deg,rgba(19,53,44,0.88),rgba(8,12,20,0.94)_60%)] p-5 sm:p-7">
            <div aria-hidden className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-mint/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Link
                  href="/admin/businesses"
                  className="text-[0.7rem] font-bold text-mint underline-offset-4 hover:underline"
                >
                  مدیریت کسب‌وکارها / صف داده
                </Link>
                <p className="mt-4 text-[0.68rem] font-black tracking-[0.12em] text-[#f4c66b]">
                  اتاق کنترل داده رشت
                </p>
                <h1 className="mt-1 text-2xl font-black leading-10 text-strong sm:text-3xl">
                  صف بررسی ورودی‌های OSM
                </h1>
                <p className="mt-2 text-[0.82rem] leading-7 text-muted">
                  نمای فقط‌خواندنی برای سنجش کیفیت اطلاعات پایه؛ هیچ گزینه‌ای برای
                  تأیید، ویرایش یا انتشار در این صفحه وجود ندارد.
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-[#f4c66b]/25 bg-[#f4c66b]/[0.07] px-4 py-3 text-xs font-bold text-[#f4c66b]">
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                انتشار عمومی: صفر
              </div>
            </div>
          </header>

          <section aria-label="خلاصه صف" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "کل رکوردها", value: summary.total, accent: "text-strong" },
              { label: "کافه", value: summary.cafes, accent: "text-mint" },
              { label: "رستوران", value: summary.restaurants, accent: "text-[#aeb7ff]" },
              { label: "دارای تلفن", value: summary.withPhone, accent: "text-[#f4c66b]" },
            ].map((metric) => (
              <div key={metric.label} className={`${GLASS} p-4 sm:p-5`}>
                <p className="text-[0.68rem] font-bold text-muted">{metric.label}</p>
                <p className={`mt-2 text-2xl font-black tabular-nums ${metric.accent}`}>
                  {faNum(metric.value)}
                </p>
              </div>
            ))}
          </section>

          <section aria-label="فیلتر صف" className={`${GLASS} p-4 sm:p-5`}>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-bold text-muted">
                  جست‌وجوی نام، نشانی یا تماس
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="مثلاً گلسار یا کافه…"
                  className="min-h-11 w-full rounded-xl border border-glass-border bg-black/20 px-4 text-sm text-strong outline-none placeholder:text-white/25 focus:border-mint focus-visible:ring-2 focus-visible:ring-mint/20"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-bold text-muted">دسته‌بندی</span>
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as "all" | OsmReviewCategory)
                  }
                  className="min-h-11 w-full rounded-xl border border-glass-border bg-[#0a0e18] px-3 text-sm font-bold text-strong outline-none focus:border-mint"
                >
                  <option value="all">همه</option>
                  <option value="cafe">کافه‌ها</option>
                  <option value="restaurant">رستوران‌ها</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-bold text-muted">کیفیت اطلاعات</span>
                <select
                  value={completeness}
                  onChange={(event) =>
                    setCompleteness(event.target.value as OsmReviewCompleteness)
                  }
                  className="min-h-11 w-full rounded-xl border border-glass-border bg-[#0a0e18] px-3 text-sm font-bold text-strong outline-none focus:border-mint"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="complete">کامل</option>
                  <option value="incomplete">نیازمند تکمیل</option>
                </select>
              </label>
            </div>
          </section>

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-black text-strong">رکوردهای قابل بررسی</h2>
            <span className="text-xs text-muted" aria-live="polite">
              نمایش {faNum(visibleCandidates.length)} از {faNum(summary.total)}
            </span>
          </div>

          {visibleCandidates.length > 0 ? (
            <section
              aria-label="رکوردهای OSM"
              className="grid grid-cols-2 items-start gap-3 lg:grid-cols-3 lg:gap-4"
            >
              {visibleCandidates.map((candidate) => (
                <CandidateCard key={candidate.sourceId} candidate={candidate} />
              ))}
            </section>
          ) : (
            <section className={`${GLASS} p-8 text-center sm:p-12`}>
              <h2 className="text-lg font-black text-strong">رکوردی با این فیلتر پیدا نشد</h2>
              <p className="mt-2 text-sm text-muted">عبارت جست‌وجو یا فیلترها را تغییر بده.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setCompleteness("all");
                }}
                className="mt-5 min-h-11 rounded-full border border-mint/35 bg-mint/10 px-5 text-sm font-bold text-mint transition-colors hover:bg-mint/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              >
                پاک‌کردن فیلترها
              </button>
            </section>
          )}

          <aside className="rounded-2xl border border-lapis/20 bg-lapis/[0.06] p-4 text-[0.72rem] leading-6 text-muted">
            <strong className="text-[#aeb7ff]">مرز این صفحه:</strong> اطلاعات پایه
            از OpenStreetMap تحت ODbL آمده است. امتیاز، نظر، تصویر، منو یا توضیح
            تجاری از منبع دیگری وارد نشده و این صفحه هیچ رکوردی را منتشر نمی‌کند.
          </aside>
        </main>
      </Container>
      <Footer />
    </>
  );
}
