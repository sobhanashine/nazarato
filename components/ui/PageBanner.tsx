export function PageBanner({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="container mb-10 lg:mb-20">
      <div className="page-banner p-8 sm:p-12 md:p-16 lg:px-36 lg:py-16">
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
    </div>
  );
}
