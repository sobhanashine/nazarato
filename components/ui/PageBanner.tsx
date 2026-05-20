import { Container } from "@/components/ui/Container";

const starWatermark =
  "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' " +
  "viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.6'%3E%3Cpath d='M40 8 " +
  "L48 23 L65 23 L56 35 L72 40 L56 45 L65 57 L48 57 L40 72 L32 57 L15 57 L24 45 L8 40 L24 35 L15 23 " +
  "L32 23 Z'/%3E%3C/g%3E%3C/svg%3E\")";

export function PageBanner({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Container className="mb-10 lg:mb-20">
      <div className="relative w-full overflow-hidden rounded-[1.25rem] border border-glass-border-hi text-strong backdrop-blur-[22px] backdrop-saturate-[180%] bg-[rgba(15,20,32,0.55)] bg-[linear-gradient(135deg,rgba(91,230,178,0.16),rgba(123,137,255,0.16))] shadow-[var(--shadow-lg)] p-8 sm:p-12 md:p-16 lg:px-36 lg:py-16">
        {/* Aurora glow */}
        <div
          aria-hidden
          className="absolute inset-[-50%] pointer-events-none opacity-90 blur-[40px]"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(91, 230, 178, 0.35), transparent 40%)," +
              "radial-gradient(circle at 80% 70%, rgba(123, 137, 255, 0.32), transparent 45%)",
          }}
        />
        {/* Hasht-pari star tessellation watermark */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ backgroundImage: starWatermark, backgroundSize: "80px 80px" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.22] object-cover mix-blend-luminosity"
          src="/images/shapes/white-vectors.svg"
          alt=""
        />
        <div className="relative z-[2]">
          <h2 className="text-[26px] md:text-[32px] font-extrabold text-strong mb-2 leading-[1.35] -tracking-[0.015em]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[15px] font-normal text-strong opacity-[0.86] leading-[1.75]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Container>
  );
}
