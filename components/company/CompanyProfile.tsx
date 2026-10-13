"use client";

import { BusinessSourceNotice } from "./BusinessSourceNotice";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { InstagramIcon, PhoneIcon, LocationIcon } from "@/components/icons";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { RatingBars } from "@/components/ui/RatingBars";
import { RatingStars, type Rating } from "@/components/ui/RatingStars";
import { useReviewSheet } from "@/components/review/ReviewSheetProvider";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { LocalExperiencePanel } from "@/components/preview/LocalExperiencePanel";
import { ReviewCard } from "@/components/ui/ReviewCard";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";
import type { Business, BusinessDetail } from "@/lib/data/businesses";
import type { Review } from "@/lib/data/reviews";

type Props = {
  business: BusinessDetail;
  reviews: Review[];
  stats: { count: number; average: number; histogram: Record<Rating, number> };
  averageLabel: string;
  similar: Business[];
  isBookmarked: boolean;
  localPreview?: boolean;
  initialReviewsTab?: boolean;
};
const TABS = [
  { id: "overview", label: "دربارهٔ مکان" },
  { id: "reviews", label: "تجربه‌ها" },
  { id: "info", label: "اطلاعات" },
  { id: "similar", label: "مکان‌های دیگر" },
] as const;
type TabId = (typeof TABS)[number]["id"];
const CARD = `${GLASS} p-5 sm:p-6`;
const HEADING = "text-lg font-bold leading-8 text-strong";

function webHref(value?: string): string | undefined {
  if (!value) return;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch { /* Show the supplied value as text when it is not a valid URL. */ }
}
function phoneHref(value?: string): string | undefined {
  if (!value) return;
  const digits = value.replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[\s()-]/g, "");
  if (/^\+?\d{7,15}$/.test(digits)) return `tel:${digits}`;
}

export function CompanyProfile({ business, reviews, stats, averageLabel, similar, isBookmarked, localPreview = false, initialReviewsTab = false }: Props) {
  const { openReviewSheet } = useReviewSheet();
  const [tab, setTab] = useState<TabId>(initialReviewsTab ? "reviews" : "overview");
  const [ratingFilter, setRatingFilter] = useState<Rating | 0>(0);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [shareNote, setShareNote] = useState("");
  const hasReviews = stats.count > 0;
  const roundedAverage = Math.min(5, Math.max(1, Math.round(stats.average))) as Rating;
  const address = business.info.find(row => ["نشانی", "آدرس"].includes(row.label))?.value;
  const visibleReviews = useMemo(() => {
    const filtered = ratingFilter ? reviews.filter(review => review.rating === ratingFilter) : reviews;
    return sort === "oldest" ? [...filtered].reverse() : filtered;
  }, [reviews, ratingFilter, sort]);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: business.name, url }); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(url); setShareNote("لینک کپی شد"); }
    catch { setShareNote("کپی نشد؛ لینک را از نوار نشانی بردار"); }
  }

  return (
    <div className="pb-12">
      {localPreview && <p className="mb-5 border-s-2 border-pomegr ps-3 text-[13px] leading-6 text-muted">پیش‌نمایش خصوصی · اطلاعات اولیهٔ مکان، تأیید مالک یا تجربهٔ مشتری نیست.</p>}
      <header className="border-b border-glass-border pb-6">
        <p className="mb-2 text-sm font-medium text-forest">{business.category} · {business.city}</p>
        <h1 className="max-w-[26ch] break-words text-[30px] font-extrabold leading-[1.5] text-strong sm:text-[40px]">{business.name}</h1>
        {business.verified && <p className="mt-2 text-sm font-semibold text-forest">کسب‌وکار تأیید شده</p>}
        {address && <p className="mt-3 flex max-w-[65ch] items-start gap-2 text-base leading-8 text-muted"><LocationIcon className="mt-2 h-4 w-4 shrink-0" /><span>{address}</span></p>}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {hasReviews ? <><RatingStars rating={roundedAverage} /><span className="font-bold">{averageLabel} از ۵</span><span className="text-muted">بر اساس {stats.count.toLocaleString("fa-IR")} تجربه</span></> : <p className="leading-7 text-muted">هنوز تجربه‌ای منتشر نشده؛ امتیازی نمایش نمی‌دهیم.</p>}
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <button type="button" onClick={() => openReviewSheet({ slug: business.slug, name: business.name })} className={`${BTN_PRIMARY} px-5 py-3 text-sm`}>{localPreview ? "ثبت تجربهٔ آزمایشی" : "نوشتن تجربه"}</button>
          <BookmarkButton businessSlug={business.slug} initialIsBookmarked={isBookmarked} localOnly={localPreview} label={isBookmarked ? "ذخیره شد" : "ذخیره"} className="border border-glass-border bg-paper px-4 py-3 text-sm text-forest" />
          <button type="button" onClick={handleShare} className="inline-flex min-h-11 items-center rounded-xl border border-glass-border bg-paper px-4 text-sm font-medium text-forest">اشتراک‌گذاری</button>
        </div>
        {shareNote && <p role="status" className="mt-2 text-sm leading-6 text-muted">{shareNote}</p>}
        <ContactDetails business={business} />
      </header>

      <BusinessSourceNotice attributions={business.attributions ?? []} />

      <div role="tablist" aria-label="بخش‌های مکان" className="mt-5 flex overflow-x-auto border-b border-glass-border">
        {TABS.map((item, index) => <button key={item.id} type="button" id={`place-tab-${item.id}`} role="tab" aria-selected={tab === item.id} aria-controls="place-panel" tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)}
          onKeyDown={event => {
            const next = event.key === "ArrowLeft" ? (index + 1) % TABS.length : event.key === "ArrowRight" ? (index + TABS.length - 1) % TABS.length : event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : null;
            if (next === null) return;
            event.preventDefault(); setTab(TABS[next].id); document.getElementById(`place-tab-${TABS[next].id}`)?.focus();
          }}
          className={`min-h-12 shrink-0 border-b-2 px-3 text-sm font-bold sm:px-5 ${tab === item.id ? "border-forest text-forest" : "border-transparent text-muted hover:text-strong"}`}>{item.label}</button>)}
      </div>

      <div role="tabpanel" id="place-panel" aria-labelledby={`place-tab-${tab}`} tabIndex={0} className="mt-6">
        {tab === "overview" && <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            {business.description && <section className={CARD}><h2 className={HEADING}>دربارهٔ {business.name}</h2><p className="mt-3 whitespace-pre-wrap text-base leading-8 text-muted">{business.description}</p></section>}
            <section className={CARD}><div className="flex flex-wrap items-center justify-between gap-2"><h2 className={HEADING}>تجربه‌های اخیر</h2>{hasReviews && <button type="button" onClick={() => setTab("reviews")} className="inline-flex min-h-11 items-center text-sm font-bold text-forest">همهٔ تجربه‌ها ←</button>}</div>
              {hasReviews ? <div className="mt-4 space-y-4">{reviews.slice(0, 3).map(review => <ReviewCard key={review.id} review={review} />)}</div> : <NoReviews />}
            </section>
          </div>
          <div className="space-y-5">
            {hasReviews && <section className={CARD}><h2 className={HEADING}>امتیاز تجربه‌ها</h2><p className="mt-4 text-3xl font-bold text-forest">{averageLabel}<span className="ms-2 text-sm font-normal text-muted">از ۵</span></p><p className="mt-2 text-sm text-muted">{stats.count.toLocaleString("fa-IR")} تجربهٔ منتشرشده</p><div className="mt-5"><RatingBars histogram={stats.histogram} total={stats.count} /></div></section>}
            {business.hours && business.hours.length > 0 && <section className={CARD}><h2 className={HEADING}>ساعات اعلام‌شده</h2><p className="mt-1 text-sm leading-6 text-muted">پیش از رفتن، با خود مکان هماهنگ کن.</p><dl className="mt-4 space-y-3 text-sm">{business.hours.map(row => <div key={row.day} className="flex justify-between gap-3"><dt className="text-muted">{row.day}</dt><dd className="tabular-nums text-strong">{row.value}</dd></div>)}</dl></section>}
            <section className={CARD}><h2 className={HEADING}>چه تجربه‌ای به انتخاب کمک می‌کند؟</h2><p className="mt-2 text-sm leading-7 text-muted">بگو چه زمانی رفتی، برای چه کاری و چه چیزی خوب بود یا می‌توانست بهتر باشد. این جزئیات به انتخاب نفر بعد کمک می‌کند.</p></section>
          </div>
        </div>}
        {tab === "reviews" && <section><h2 className={HEADING}>تجربه‌های مردم</h2>{hasReviews ? <>
          <div className="mt-4 flex flex-wrap gap-2"><FilterButton active={ratingFilter === 0} onClick={() => setRatingFilter(0)}>همه</FilterButton>{([5, 4, 3, 2, 1] as Rating[]).map(rating => <FilterButton key={rating} active={ratingFilter === rating} onClick={() => setRatingFilter(rating)}>{rating.toLocaleString("fa-IR")} ★</FilterButton>)}<FilterButton active={sort === "newest"} onClick={() => setSort("newest")}>جدیدترین</FilterButton><FilterButton active={sort === "oldest"} onClick={() => setSort("oldest")}>قدیمی‌ترین</FilterButton></div>
          {visibleReviews.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{visibleReviews.map(review => <ReviewCard key={review.id} review={review} />)}</div> : <p className="mt-6 text-base text-muted">تجربه‌ای با این امتیاز نداریم.</p>}
        </> : <NoReviews />}</section>}
        {tab === "info" && <section><h2 className={HEADING}>اطلاعات ثبت‌شده</h2><dl className="mt-4 divide-y divide-glass-border rounded-xl border border-glass-border bg-paper px-5">
          {[{ label: "نوع مکان", value: business.category }, { label: "شهر", value: business.city }, ...business.info].map((row, index) => <div key={`${row.label}-${index}`} className="grid gap-1 py-4 sm:grid-cols-[150px_1fr]"><dt className="text-sm text-muted">{row.label}</dt><dd className="min-w-0 break-words text-sm leading-7 text-strong">{row.value}</dd></div>)}
        </dl><Link href="/contact" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-forest">اصلاح اطلاعات این مکان ←</Link></section>}
        {tab === "similar" && <section><h2 className={HEADING}>مکان‌های دیگر</h2><p className="mt-1 text-sm leading-7 text-muted">مکان‌های موجود در فهرست؛ ترتیب به معنی توصیهٔ شخصی نیست.</p>{similar.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{similar.map(item => <BusinessCard key={item.slug} business={item} />)}</div> : <p className="mt-4 text-base text-muted">فعلاً مکان دیگری در فهرست نیست.</p>}</section>}
      </div>
      {localPreview && <LocalExperiencePanel slug={business.slug} name={business.name} />}
      {!business.claimed && <aside className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-glass-border pt-5"><p className="text-sm leading-7 text-muted">صاحب این مکان هستی؟ مسیر معرفی و همکاری را ببین.</p><Link href="/for-business" className="inline-flex min-h-11 items-center text-sm font-bold text-forest">برای صاحبان کسب‌وکار ←</Link></aside>}
    </div>
  );
}
function NoReviews() {
  return <div className="mt-3 border-t border-glass-border pt-4"><p className="text-base font-semibold text-strong">هنوز تجربه‌ای منتشر نشده</p><p className="mt-2 max-w-[55ch] text-sm leading-7 text-muted">اطلاعات این صفحه برای آشنایی اولیه است. وقتی تجربهٔ دست اولی ثبت و بررسی شود، اینجا نمایش داده می‌شود.</p></div>;
}
function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm ${active ? "border-forest bg-forest text-white" : "border-glass-border bg-paper text-muted"}`}>{children}</button>;
}
function ContactDetails({ business }: { business: BusinessDetail }) {
  const { phone, website, instagram } = business.contact;
  if (!phone && !website && !instagram) return null;
  const account = instagram?.replace(/^@/, "");
  return <div className="mt-4 flex flex-wrap gap-2" aria-label="ارتباط با مکان">
    {phone && <ContactLink href={phoneHref(phone)} label={phone} icon={<PhoneIcon />} />}
    {website && <ContactLink href={webHref(website)} label={website} />}
    {account && <ContactLink href={/^[a-zA-Z0-9_.]{1,30}$/.test(account) ? `https://instagram.com/${account}` : undefined} label={`@${account}`} icon={<InstagramIcon />} />}
  </div>;
}
function ContactLink({ href, label, icon }: { href?: string; label: string; icon?: ReactNode }) {
  const className = "inline-flex min-h-11 max-w-full items-center gap-2 break-all rounded-lg border border-glass-border bg-paper px-3 py-2 text-sm text-forest [&_svg]:h-4 [&_svg]:w-4";
  const content = <>{icon}<span dir="ltr">{label}</span></>;
  return href ? <a href={href} target={href.startsWith("tel:") ? undefined : "_blank"} rel="noopener noreferrer" className={className}>{content}</a> : <span className={className}>{content}</span>;
}
