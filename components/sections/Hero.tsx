import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { HeroStats } from "@/components/sections/HeroStats";

const popularSearches = [
  "آرایشگاه",
  "کافه",
  "تعمیرگاه",
  "کلینیک پوست",
  "رستوران",
];

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-blob-1" />
      <div className="hero-blob-2" />
      <div className="hero-blob-3" />
      <div className="hero-blob-4" />
      <div className="hero-grid" aria-hidden />

      <div className="container">
        <div className="hero-content">
          <span className="hero-eyebrow">
            <span className="hero-eyebrow-dot" aria-hidden />
            پلتفرم نظرات واقعی ایرانیان
          </span>

          <h1>
            اعتماد کن، <strong>تجربه کن</strong>
            <span className="hero-h1-sub">قبل از خرید، نظر بقیه رو بخون.</span>
          </h1>

          <div className="search-box">
            <input
              type="text"
              placeholder="کسب و کار، فروشگاه یا دسته‌بندی..."
              aria-label="جستجو"
            />
            <span className="search-icon" aria-hidden><SearchIcon /></span>
            {/* <kbd className="search-kbd" aria-hidden>/</kbd> */}
          </div>

          <div className="hero-chips" aria-label="جستجوهای پرطرفدار">
            <span className="hero-chips-label">پرطرفدار:</span>
            {popularSearches.map((s) => (
              <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="hero-chip">
                {s}
              </Link>
            ))}
          </div>

          <HeroStats />
        </div>
      </div>
    </section>
  );
}
