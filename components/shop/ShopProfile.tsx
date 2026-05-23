"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { InstagramIcon, MailIcon, PhoneIcon } from "@/components/icons";
import { RatingBars } from "@/components/ui/RatingBars";
import { RatingStars, type Rating } from "@/components/ui/RatingStars";
import { useReviewSheet } from "@/components/review/ReviewSheetProvider";
import { ReviewCard } from "@/components/ui/ReviewCard";
import { IgShopCard } from "@/components/ui/IgShopCard";
import { IgAvatar } from "@/components/ui/IgAvatar";
import { IgVerifiedBadge } from "@/components/ui/IgVerifiedBadge";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";
import type { BusinessDetail } from "@/lib/data/businesses";
import type { InstagramShop } from "@/lib/data/instagram-shops";
import type { Review } from "@/lib/data/reviews";

type Stats = {
  count: number;
  average: number;
  histogram: Record<Rating, number>;
};

type Props = {
  business: BusinessDetail;
  reviews: Review[];
  stats: Stats;
  averageLabel: string;
  similar: InstagramShop[];
};

const TABS = [
  { id: "overview", label: "نمای کلی" },
  { id: "reviews", label: "نظرات" },
  { id: "info", label: "اطلاعات" },
  { id: "similar", label: "مشابه" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const RATING_FILTERS: Rating[] = [5, 4, 3, 2, 1];
const CARD = `${GLASS} p-5 sm:p-6`;
const SECTION_H2 = "text-[1.05rem] font-extrabold text-strong";

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px].w-[18px]" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 4.5h12a1 1 0 0 1 1 1v14l-7-4-7 4v-14a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17" cy="6" r="2.5" />
      <circle cx="17" cy="18" r="2.5" />
      <path d="M8.2 10.8 14.8 7.2M8.2 13.2 14.8 16.8" />
    </svg>
  );
}

export function ShopProfile({ business, reviews, stats, averageLabel, similar }: Props) {
  const { openReviewSheet } = useReviewSheet();
  const [tab, setTab] = useState<TabId>("overview");
  const [ratingFilter, setRatingFilter] = useState<Rating | 0>(0);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [saved, setSaved] = useState(false);
  const [shareNote, setShareNote] = useState("");

  const hasReviews = stats.count > 0;
  const roundedAverage = Math.min(5, Math.max(1, Math.round(stats.average))) as Rating;

  const visibleReviews = useMemo(() => {
    const filtered = ratingFilter
      ? reviews.filter((r) => r.rating === ratingFilter)
      : reviews;
    return sort === "oldest" ? [...filtered].reverse() : filtered;
  }, [reviews, ratingFilter, sort]);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: business.name, url });
      } catch {
        /* user dismissed the share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareNote("لینک کپی شد");
      setTimeout(() => setShareNote(""), 2000);
    } catch {
      setShareNote("کپی نشد");
      setTimeout(() => setShareNote(""), 2000);
    }
  }

  return (
    <div className="pb-12">
      {/* ── Cover ── */}
      <div
        className="h-36 w-full rounded-glass border border-glass-border sm:h-52"
        style={{
          background: `linear-gradient(135deg, ${business.color}55 0%, rgba(12,16,28,0.6) 60%), linear-gradient(180deg, rgba(123,137,255,0.18), rgba(91,230,178,0.12))`,
        }}
        aria-hidden
      />

      {/* ── Identity ── */}
      <div className="-mt-12 flex flex-col gap-4 px-1 sm:-mt-14 sm:flex-row sm:items-end">
        <IgAvatar initial={business.initial} color={business.color} size="lg" />
        <div className="min-w-0 flex-1 sm:pb-2">
          <h1 className="flex items-center gap-2 text-[1.4rem] font-black text-strong sm:text-[1.7rem]">
            <span className="min-w-0 break-words">{business.name}</span>
            {business.verified && <IgVerifiedBadge size="lg" />}
          </h1>
          <p className="mt-1 text-[0.85rem] text-muted">
            {business.category} · {business.city}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {hasReviews ? (
              <>
                <RatingStars rating={roundedAverage} />
                <span className="text-[0.9rem] font-bold text-strong">
                  {averageLabel} از ۵
                </span>
                <span className="text-[0.8rem] text-muted">
                  ({stats.count.toLocaleString("fa-IR")} نظر)
                </span>
              </>
            ) : (
              <span className="text-[0.82rem] text-muted">هنوز نظری ثبت نشده</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Unclaimed banner ── */}
      {!business.claimed && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-glass border border-saffron/30 bg-saffron/[0.08] px-4 py-3">
          <p className="text-[0.83rem] text-strong">
            این فروشگاه هنوز صاحبش رو ثبت نکرده.
          </p>
          <Link
            href={`/shop/${business.slug}/claim`}
            className="text-[0.83rem] font-bold text-saffron hover:underline"
          >
            ادعای مالکیت ←
          </Link>
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={() => openReviewSheet({ slug: business.slug, name: business.name })}
          className={`${BTN_PRIMARY} relative z-[1] w-full justify-center px-6 py-3 text-[0.9rem] sm:w-auto sm:py-2.5`}
        >
          <span
            aria-hidden
            className="absolute inset-[-8px] rounded-full bg-[radial-gradient(circle,rgba(91,230,178,0.45),transparent_70%)] blur-[10px] z-[-1] pointer-events-none animate-[fab-pulse_2.6s_ease-in-out_infinite] motion-reduce:animate-none"
          />
          نوشتن نظر
        </button>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <button
            type="button"
            onClick={() => setSaved((s) => !s)}
            aria-pressed={saved}
            className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-[0.85rem] font-semibold transition-colors duration-200 sm:py-2.5 ${
              saved
                ? "border-mint/55 bg-mint/[0.12] text-mint"
                : "border-glass-border bg-glass text-muted hover:border-mint/45 hover:text-strong"
            }`}
          >
            <BookmarkIcon filled={saved} />
            {saved ? "ذخیره شد" : "ذخیره"}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-glass-border bg-glass px-5 py-3 text-[0.85rem] font-semibold text-muted transition-colors duration-200 hover:border-mint/45 hover:text-strong sm:py-2.5"
          >
            <ShareIcon />
            {shareNote || "اشتراک"}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        role="tablist"
        aria-label="بخش‌های پروفایل"
        className="mt-7 flex gap-1 overflow-x-auto border-b border-glass-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`shrink-0 border-b-2 px-4 py-2.5 text-[0.88rem] font-bold transition-colors duration-200 ${
                active
                  ? "border-mint text-strong"
                  : "border-transparent text-muted hover:text-strong"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div role="tabpanel" className="mt-6 flex flex-col gap-5 lg:grid lg:grid-cols-3">
          <div className="contents lg:flex lg:flex-col lg:gap-5 lg:col-span-2">
            <section className={`${CARD} order-1 lg:order-none`}>
              <h2 className={SECTION_H2}>درباره</h2>
              <p className="mt-3 text-[0.9rem] leading-[2] text-muted">
                {business.description || "توضیحاتی برای این فروشگاه ثبت نشده است."}
              </p>
            </section>

            <section className={`${CARD} order-3 lg:order-none`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className={SECTION_H2}>نظرات اخیر</h2>
                {hasReviews && (
                  <button
                    type="button"
                    onClick={() => setTab("reviews")}
                    className="shrink-0 text-[0.85rem] font-bold text-mint hover:underline"
                  >
                    همه نظرات ←
                  </button>
                )}
              </div>
              {hasReviews ? (
                <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
                  {reviews.slice(0, 3).map((r) => (
                    <div key={r.id} className="w-[85%] shrink-0 snap-start sm:w-auto">
                      <ReviewCard review={r} />
                    </div>
                  ))}
                </div>
              ) : (
                <NoReviews business={business} />
              )}
            </section>
          </div>

          <div className="contents lg:flex lg:flex-col lg:gap-5">
            <section className={`${CARD} order-2 lg:order-none`}>
              <h2 className={SECTION_H2}>توزیع امتیاز</h2>
              {hasReviews ? (
                <>
                  <div className="mt-4 flex flex-col items-center gap-2.5 rounded-2xl border border-glass-border bg-[#0b0f1a] py-5">
                    <span className="bg-[linear-gradient(135deg,#5BE6B2,#3FBF92)] bg-clip-text text-[3.4rem] font-black leading-none text-transparent">
                      {averageLabel}
                    </span>
                    <RatingStars rating={roundedAverage} />
                    <p className="text-[0.8rem] text-muted">
                      بر اساس {stats.count.toLocaleString("fa-IR")} نظر
                    </p>
                  </div>
                  <div className="mt-5 border-t border-glass-border pt-4">
                    <RatingBars histogram={stats.histogram} total={stats.count} />
                  </div>
                </>
              ) : (
                <p className="mt-3 text-[0.85rem] text-muted">
                  با ثبت اولین نظر، امتیاز این فروشگاه شکل می‌گیرد.
                </p>
              )}
            </section>

            <IgContactCard business={business} className="order-4 lg:order-none" />
          </div>
        </div>
      )}

      {/* ── Reviews ── */}
      {tab === "reviews" && (
        <div role="tabpanel" className="mt-6">
          <h2 className={SECTION_H2}>نظرات کاربران</h2>
          {hasReviews ? (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <FilterChip
                  active={ratingFilter === 0}
                  onClick={() => setRatingFilter(0)}
                  label="همه"
                />
                {RATING_FILTERS.map((star) => (
                  <FilterChip
                    key={star}
                    active={ratingFilter === star}
                    onClick={() => setRatingFilter(star)}
                    label={`${star.toLocaleString("fa-IR")} ★`}
                  />
                ))}
                <div className="mr-auto flex gap-1">
                  <SortButton
                    active={sort === "newest"}
                    onClick={() => setSort("newest")}
                    label="جدیدترین"
                  />
                  <SortButton
                    active={sort === "oldest"}
                    onClick={() => setSort("oldest")}
                    label="قدیمی‌ترین"
                  />
                </div>
              </div>

              {visibleReviews.length > 0 ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {visibleReviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-[0.88rem] text-muted">
                  نظری با این فیلتر پیدا نشد.
                </p>
              )}
            </>
          ) : (
            <div className="mt-4">
              <NoReviews business={business} />
            </div>
          )}
        </div>
      )}

      {/* ── Info ── */}
      {tab === "info" && (
        <div role="tabpanel" className="mt-6">
          <h2 className={SECTION_H2}>اطلاعات فروشگاه اینستاگرامی</h2>
          <dl className="mt-4 grid gap-px overflow-hidden rounded-glass border border-glass-border bg-glass-border sm:grid-cols-2">
            {[
              { label: "دسته‌بندی (نیش)", value: business.category },
              { label: "نوع پلتفرم", value: "اینستاگرام" },
              { label: "آی‌دی اینستاگرام", value: `@${business.slug}` },
              ...business.info,
              ...(business.contact.website
                ? [{ label: "وب‌سایت", value: business.contact.website }]
                : []),
              ...(business.contact.phone
                ? [{ label: "تلفن", value: business.contact.phone }]
                : []),
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-3 bg-[#0c1018] px-4 py-3">
                <dt className="text-[0.83rem] text-muted">{row.label}</dt>
                <dd className="text-[0.83rem] font-semibold text-strong">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* ── Similar ── */}
      {tab === "similar" && (
        <div role="tabpanel" className="mt-6">
          <h2 className={SECTION_H2}>فروشگاه‌های مشابه</h2>
          {similar.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {similar.map((s) => (
                <IgShopCard key={s.handle} shop={s} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[0.88rem] text-muted">
              فعلاً فروشگاه مشابهی در این دسته‌بندی ثبت نشده.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function NoReviews({ business }: { business: { slug: string; name: string } }) {
  const { openReviewSheet } = useReviewSheet();
  return (
    <div className="mt-3 flex flex-col items-center gap-3 rounded-glass border border-dashed border-glass-border-hi px-6 py-10 text-center">
      <p className="text-[0.92rem] font-bold text-strong">هنوز نظری ثبت نشده</p>
      <p className="max-w-[34ch] text-[0.83rem] leading-[1.9] text-muted">
        اولین نفری باش که تجربه‌اش رو با بقیه به اشتراک می‌ذاره.
      </p>
      <button
        type="button"
        onClick={() => openReviewSheet({ slug: business.slug, name: business.name })}
        className={`${BTN_PRIMARY} relative z-[1] px-6 py-2.5 text-[0.88rem]`}
      >
        <span
          aria-hidden
          className="absolute inset-[-8px] rounded-full bg-[radial-gradient(circle,rgba(91,230,178,0.45),transparent_70%)] blur-[10px] z-[-1] pointer-events-none animate-[fab-pulse_2.6s_ease-in-out_infinite] motion-reduce:animate-none"
        />
        اولین نظر را تو بنویس
      </button>
    </div>
  );
}

function IgContactCard({
  business,
  className = "",
}: {
  business: BusinessDetail;
  className?: string;
}) {
  const instagram = business.contact.instagram || business.slug;
  const website = business.contact.website;
  const phone = business.contact.phone;

  return (
    <section className={`${CARD} ${className}`}>
      <h2 className={SECTION_H2}>اطلاعات تماس</h2>
      <div className="mt-3 flex flex-col gap-2">
        <ContactRow
          icon={<InstagramIcon />}
          label="اینستاگرام"
          value={`@${instagram}`}
          href={`https://instagram.com/${instagram}`}
        />
        <ContactRow
          icon={
            <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
          label="ارسال پیام (DM)"
          value="ارسال دایرکت مستقیم"
          href={`https://ig.me/m/${instagram}`}
        />
        {website && (
          <ContactRow
            icon={<MailIcon />}
            label="وب‌سایت"
            value={website}
            href={`https://${website}`}
          />
        )}
        {phone && (
          <ContactRow icon={<PhoneIcon />} label="تلفن" value={phone} />
        )}
      </div>
    </section>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-glass-border bg-glass text-mint [&>svg]:h-[17px] [&>svg]:w-[17px]">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.72rem] text-muted">{label}</span>
        <span dir="ltr" className="truncate text-right text-[0.85rem] font-semibold text-strong">
          {value}
        </span>
      </span>
    </>
  );
  const base = "flex items-center gap-3 rounded-xl border border-glass-border bg-[#0b0f1a] px-3 py-2.5";
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} transition-colors duration-200 hover:border-mint/40`}
    >
      {body}
    </a>
  ) : (
    <div className={base}>{body}</div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-[0.78rem] font-semibold transition-colors duration-200 ${
        active
          ? "border-mint/55 bg-mint/[0.14] text-strong"
          : "border-glass-border bg-glass text-muted hover:border-mint/45 hover:text-strong"
      }`}
    >
      {label}
    </button>
  );
}

function SortButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-[0.78rem] font-semibold transition-colors duration-200 ${
        active ? "text-mint" : "text-muted hover:text-strong"
      }`}
    >
      {label}
    </button>
  );
}
