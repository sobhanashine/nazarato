import Link from "next/link";
import { ArrowLeftIcon, StarIcon } from "@/components/icons";
import { recentReviews, type Review } from "@/lib/data/reviews";

function Stars({ rating }: { rating: Review["rating"] }) {
  return (
    <div className="review-stars" data-rating={rating} role="img" aria-label={`${rating} از ۵`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`star-chip${i < rating ? " is-on" : ""}`}>
          <StarIcon />
        </span>
      ))}
    </div>
  );
}


export function RecentReviews() {
  return (
    <section className="section-wrap">
      <div className="container">
        <div className="section-head">
          <div className="section-head-row">
            <h2>نظرات <strong>اخیر</strong> فروشگاه‌های آنلاین</h2>
            <Link href="/reviews" className="see-all">
              <span>تمامی نظرات</span>
              <ArrowLeftIcon />
            </Link>
          </div>
          <p className="section-desc">آخرین نظرات ثبت‌شده توسط کاربران درباره فروشگاه‌های آنلاین.</p>
        </div>

        <div className="reviews-grid">
          {recentReviews.map((r) => (
            <article key={r.id} className="review-card">
              <div className="review-top">
                <div className="review-user">
                  <div className="review-avatar" style={{ background: r.user.color }}>
                    {r.user.initial}
                    <span className="verified-tick" aria-label="کاربر تایید شده" title="کاربر تایید شده">
                      <svg viewBox="0 0 12 12" aria-hidden>
                        <path d="M2.5 6.2l2.4 2.3 4.6-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                  <div className="review-user-info">
                    <div className="review-user-name">{r.user.name}</div>
                    <Link href={r.shop.href} className="review-company-link">{r.shop.name}</Link>
                  </div>
                </div>
                <Stars rating={r.rating} />
              </div>
              <p className="review-text">{r.text}</p>
              <div className="review-footer">
                <span className="review-date">{r.date}</span>
                <div className="review-actions">
                  <button type="button" className="review-action review-helpful">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" />
                      <path d="M7 11l4-8a2 2 0 0 1 3 1.7V9h5a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 20H7" />
                    </svg>
                    مفید بود
                  </button>
                  <button type="button" className="review-action review-report" aria-label="گزارش تخلف">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M4 21V4l8 2 8-2v12l-8 2-8-2" />
                      <path d="M4 21V13" />
                    </svg>
                    گزارش تخلف
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
