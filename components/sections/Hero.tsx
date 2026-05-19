import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { HeroStats } from "@/components/sections/HeroStats";

const popularSearches = [
  "آرایشگاه",
  "کافه",
  "تعمیرگاه",
  "کلینیک پوست",
  "رستوران",
  "ورزشی"
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
        <div className="relative z-[2] flex flex-col items-center gap-5 text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-glass border border-glass-border backdrop-blur-[14px] backdrop-saturate-[160%] text-[12.5px] text-muted tracking-[0.01em]">
            <span className="hero-eyebrow-dot" aria-hidden />
            پلتفرم نظرات واقعی ایرانیان
          </span>

          <h1 className="mt-1 text-[2.1rem] sm:text-5xl lg:text-6xl font-extrabold text-strong leading-[1.2] -tracking-[0.025em]">
            اعتماد کن,{" "}
            <strong className="font-[inherit] bg-[linear-gradient(135deg,#5BE6B2_0%,#7B89FF_100%)] bg-clip-text text-transparent [text-shadow:0_0_40px_rgba(91,230,178,0.25)]">
              تجربه کن
            </strong>
            <span className="block mt-3.5 sm:mt-4 text-[0.95rem] sm:text-[1.05rem] font-normal text-muted tracking-normal">
              قبل از خرید، نظر بقیه رو بخون.
            </span>
          </h1>

          <div className="search-box">
            <input
              type="text"
              placeholder="کسب و کار، فروشگاه یا دسته‌بندی..."
              aria-label="جستجو"
            />
            <span
              className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center text-mint pointer-events-none"
              aria-hidden
            >
              <SearchIcon />
            </span>
          </div>

          <div
            className="flex flex-wrap items-center justify-center gap-y-[0.45rem] gap-x-2 mt-2 max-w-[620px]"
            aria-label="جستجوهای پرطرفدار"
          >
            <span className="w-full text-center text-xs text-muted mb-0.5 tracking-[0.01em]">
              پرطرفدار:
            </span>
            {popularSearches.map((s) => (
              <Link
                key={s}
                href={`/search?q=${encodeURIComponent(s)}`}
                className="inline-flex items-center px-3.5 py-1.5 text-[13px] text-strong bg-glass border border-glass-border rounded-full backdrop-blur-[10px] transition-[background,color,border-color,transform] duration-200 hover:text-mint hover:bg-glass-hover hover:border-mint/45 hover:-translate-y-px"
              >
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
