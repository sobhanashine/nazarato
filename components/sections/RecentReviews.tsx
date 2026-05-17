import Link from "next/link";
import { ArrowLeftIcon, StarIcon } from "@/components/icons";
import { recentReviews, type Review } from "@/lib/data/reviews";

function Stars({ rating }: { rating: Review["rating"] }) {
  return (
    <div className="review-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon key={i} className={i < rating ? "filled" : "empty"} />
      ))}
    </div>
  );
}

export function RecentReviews() {
  return (
    <section className="section-wrap">
      <div className="container">
        <div className="section-head">
          <h2>نظرات <strong>اخیر</strong> فروشگاه‌های آنلاین</h2>
          <div className="section-meta">
            <p>آخرین نظرات ثبت‌شده توسط کاربران درباره فروشگاه‌های آنلاین.</p>
            <Link href="/reviews" className="see-all">
              <span>تمامی نظرات</span>
              <ArrowLeftIcon />
            </Link>
          </div>
        </div>

        <div className="reviews-grid">
          {recentReviews.map((r) => (
            <article key={r.id} className="review-card">
              <div className="review-top">
                <div className="review-user">
                  <div className="review-avatar" style={{ background: r.user.color }}>{r.user.initial}</div>
                  <div className="review-user-info">
                    <div className="review-user-name">{r.user.name}</div>
                    <Link href={r.shop.href} className="review-company-link">{r.shop.name}</Link>
                  </div>
                </div>
                <span className="review-date">{r.date}</span>
              </div>
              <Stars rating={r.rating} />
              <p className="review-text">{r.text}</p>
              <div className="review-footer">
                <StarIcon />
                <span>{r.rating} از ۵</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
