import Link from "next/link";
import { ArrowLeftIcon, LocationIcon, StarIcon } from "@/components/icons";
import { companies } from "@/lib/data/companies";

export function BestCompanies() {
  return (
    <section className="section-wrap">
      <div className="container" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--black)", marginBottom: "0.75rem" }}>
          بهترین‌های <strong style={{ color: "var(--green)" }}>فناوری</strong>
        </h2>
        <Link href="/categories" className="see-all">
          <span>تمامی دسته‌بندی‌ها</span>
          <ArrowLeftIcon />
        </Link>
      </div>

      <div className="best-scroll hide-scroll">
        <div className="best-scroll-inner">
          {companies.map((co) => (
            <Link key={co.href} href={co.href} className="co-card">
              <div className="co-top">
                <div className="co-avatar" style={{ background: co.color }}>{co.initial}</div>
                <span className="co-name">{co.name}</span>
              </div>
              <div className="co-rating">
                <StarIcon className="star-ico" />
                <span className="co-score">{co.score}</span>
                <span className="co-reviews">({co.reviews} نظر)</span>
              </div>
              <div className="co-loc">
                <LocationIcon />
                <span>{co.city}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
