import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { HeroStats } from "@/components/sections/HeroStats";
import { Container } from "@/components/ui/Container";

const popularSearches = [
  "آرایشگاه",
  "کافه",
  "تعمیرگاه",
  "کلینیک پوست",
  "رستوران",
  "ورزشی",
];

// Liquid colored blobs — drift + breathe behind the hero copy.
const blobBase =
  "absolute rounded-full blur-[70px] opacity-55 pointer-events-none [will-change:transform,opacity] motion-reduce:animate-none";
const blobs = [
  {
    pos: "-top-[120px] -left-[100px] w-[460px] h-[460px] animate-[blob-drift-1_22s_ease-in-out_infinite]",
    bg: "radial-gradient(circle, rgba(91, 230, 178, 0.55), transparent 70%)",
  },
  {
    pos: "-bottom-[140px] left-[8%] w-[340px] h-[340px] animate-[blob-drift-2_26s_ease-in-out_infinite]",
    bg: "radial-gradient(circle, rgba(123, 137, 255, 0.50), transparent 70%)",
  },
  {
    pos: "top-[60px] left-[240px] w-[220px] h-[220px] animate-[blob-drift-3_19s_ease-in-out_infinite]",
    bg: "radial-gradient(circle, rgba(245, 181, 68, 0.35), transparent 70%)",
  },
  {
    pos: "top-[30%] -right-[80px] w-[300px] h-[300px] animate-[blob-drift-4_24s_ease-in-out_infinite]",
    bg: "radial-gradient(circle, rgba(255, 107, 149, 0.40), transparent 70%)",
  },
];

const starGrid =
  "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' " +
  "viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%235BE6B2' stroke-width='0.6'%3E%3Cpath d='M40 8 " +
  "L48 23 L65 23 L56 35 L72 40 L56 45 L65 57 L48 57 L40 72 L32 57 L15 57 L24 45 L8 40 L24 35 L15 23 " +
  "L32 23 Z'/%3E%3C/g%3E%3C/svg%3E\")";

const auroraSweep =
  "conic-gradient(from 0deg, transparent 0deg, rgba(91, 230, 178, 0.08) 60deg, transparent 120deg, " +
  "rgba(123, 137, 255, 0.07) 180deg, transparent 240deg, rgba(245, 181, 68, 0.06) 300deg, transparent 360deg)";

export function Hero() {
  return (
    <section className="relative overflow-hidden -top-[72px] -mb-[72px] pt-32 pb-12 sm:-top-20 sm:-mb-20 sm:pt-44 sm:pb-24 lg:pt-48 lg:pb-32">
      {/* Slow rotating conic aurora sweep */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 w-[140%] aspect-square -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none animate-[aurora-spin_40s_linear_infinite] motion-reduce:animate-none"
        style={{
          background: auroraSweep,
          filter: "blur(60px)",
          maskImage: "radial-gradient(circle at center, #000 0%, transparent 60%)",
          WebkitMaskImage: "radial-gradient(circle at center, #000 0%, transparent 60%)",
        }}
      />

      {blobs.map((b, i) => (
        <div key={i} aria-hidden className={`${blobBase} ${b.pos}`} style={{ background: b.bg }} />
      ))}

      {/* Persian 8-point star tessellation */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-10 [will-change:background-position,opacity] animate-[grid-drift_60s_linear_infinite,grid-breathe_8s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          backgroundImage: starGrid,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, #000 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 0%, transparent 70%)",
        }}
      />

      <Container>
        <div className="relative z-[2] flex flex-col items-center gap-5 text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-glass border border-glass-border backdrop-blur-[14px] backdrop-saturate-[160%] text-[12.5px] text-muted tracking-[0.01em]">
            <span
              aria-hidden
              className="w-[7px] h-[7px] rounded-full bg-mint shadow-[0_0_0_4px_rgba(91,230,178,0.15),0_0_12px_rgba(91,230,178,0.7)] animate-[pulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none"
            />
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

          <div className="relative w-full max-w-[620px] h-[60px] mt-2 sm:h-16">
            {/* Soft gradient glow behind the input */}
            <div
              aria-hidden
              className="absolute inset-[-3px] rounded-full blur-[16px] opacity-75 z-[-1] bg-[linear-gradient(135deg,rgba(91,230,178,0.45),rgba(123,137,255,0.45),rgba(255,107,149,0.30))]"
            />
            <input
              type="text"
              placeholder="کسب و کار، فروشگاه یا دسته‌بندی..."
              aria-label="جستجو"
              className="w-full h-full pr-7 pl-[3.25rem] bg-[rgba(13,17,28,0.65)] backdrop-blur-[18px] backdrop-saturate-[180%] border border-glass-border-hi rounded-full text-[15px] text-strong outline-none transition-[box-shadow,border-color] duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] placeholder:text-[#6b7385] focus:border-mint/55 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_4px_rgba(91,230,178,0.18),0_12px_40px_rgba(0,0,0,0.45)]"
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
      </Container>
    </section>
  );
}
