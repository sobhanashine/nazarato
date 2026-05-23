"use client";

import Link from "next/link";
import { useReviewSheet } from "@/components/review/ReviewSheetProvider";
import { Container } from "@/components/ui/Container";

export function HowItWorks() {
  const { openReviewSheet } = useReviewSheet();

  return (
    <section className="py-8 md:py-12 relative z-10">
      <Container>
        {/* Outer Banner */}
        <div className="relative rounded-[28px] bg-gradient-to-r from-[#0b241c] via-[#09141b] to-glass/30 border border-glass-border backdrop-blur-xl p-6 sm:p-10 md:p-12 overflow-hidden shadow-lg hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300">
          
          {/* Accent Glow Background */}
          <div aria-hidden className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-mint/10 blur-3xl pointer-events-none" />
          <div aria-hidden className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-lapis/10 blur-3xl pointer-events-none" />

          {/* Grid Layout (2 columns on desktop) */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Right side (RTL): Platform explanation (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-start text-right">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-mint/10 border border-mint/20 text-[12.5px] font-bold text-mint tracking-wide mb-4">
                ما نظراتو هستیم
              </span>
              
              <h2 className="text-[1.8rem] sm:text-[2.2rem] md:text-[2.6rem] font-black text-strong leading-[1.25] -tracking-[0.015em] mb-5">
                سکوی مستقل نظرات برای همه
              </h2>
              
              <p className="text-[14px] sm:text-[15.5px] text-muted leading-[1.8] max-w-[620px] mb-8 font-normal">
                نظراتو پلتفرمی آزاد برای اشتراک‌گذاری تجربه‌های واقعی خرید شماست. مأموریت ما کمک به خریداران برای انتخابی آگاهانه‌تر در خرید از برندهای بزرگ ایرانی و فروشگاه‌های اینستاگرامی است. از سوی دیگر، به کسب‌وکارهای متعهد کمک می‌کنیم تا با شنیدن صدای مشتریان خود بهبود یابند.
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => openReviewSheet()}
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-strong text-[#06080f] font-extrabold text-[14.5px] transition-all duration-200 hover:bg-white hover:scale-[1.02] active:scale-98 shadow-md cursor-pointer w-full sm:w-auto text-center"
                >
                  ثبت تجربه خرید شما
                </button>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-glass border border-glass-border hover:bg-glass-hover hover:border-glass-border-hi text-[14px] text-strong font-medium transition-all duration-200 w-full sm:w-auto text-center"
                >
                  نظراتو چطور کار می‌کند؟
                </Link>
              </div>
            </div>
            
            {/* Left side (RTL): Trust/Verification card (5 cols) */}
            <div className="lg:col-span-5 w-full">
              <div className="group relative rounded-[22px] bg-[#032017]/85 border border-mint/20 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl h-full min-h-[250px] hover:border-mint/35 hover:shadow-[0_10px_30px_rgba(91,230,178,0.08)] transition-all duration-300">
                
                {/* Micro glow inside the card */}
                <div aria-hidden className="absolute -bottom-16 -right-16 w-36 h-36 rounded-full bg-mint/15 blur-2xl pointer-events-none" />
                
                <div className="relative z-10">
                  <h3 className="text-[1.2rem] sm:text-[1.3rem] font-extrabold text-strong mb-3">
                    سیستم نقد تأییدشده ما فعال شد!
                  </h3>
                  
                  <p className="text-[12.5px] sm:text-[13.5px] text-muted leading-[1.7] mb-6">
                    ما با بررسی تصاویر فاکتور خرید، پیامک پرداخت یا اسکرین‌شات دایرکت اینستاگرام، اصالت نظرات خریداران را راستی‌آزمایی می‌کنیم تا نظرات فیک یا تبلیغاتی جایی در نظراتو نداشته باشند.
                  </p>
                </div>

                {/* Footer of card: Responsive layout */}
                <div className="relative z-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-6 sm:mt-auto w-full">
                  <Link
                    href="/about#verification"
                    className="w-full sm:w-auto text-center inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-glass-border hover:border-mint/40 text-[13px] text-strong font-semibold transition-all duration-200 hover:bg-mint/5"
                  >
                    ببینید چطور کار می‌کند
                  </Link>

                  {/* Overlapping Interlocking Circles graphic */}
                  <div className="relative flex items-center shrink-0 w-16 sm:w-20 h-10 sm:h-12 transition-transform duration-300 group-hover:scale-105 mx-auto sm:mx-0">
                    {/* Circle 1: Instagram Logo Gradient border + Shop Icon */}
                    <div className="absolute left-0 top-0 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e1306c] to-[#bc1888] p-[2px] shadow-lg z-10">
                      <div className="w-full h-full rounded-full bg-[#031c14] flex items-center justify-center text-strong">
                        <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                        </svg>
                      </div>
                    </div>

                    {/* Circle 2: Mint green border + Storefront icon (overlays on right in RTL) */}
                    <div className="absolute right-0 top-0 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-tr from-mint to-[#3fbf92] p-[2px] shadow-lg">
                      <div className="w-full h-full rounded-full bg-[#031c14] flex items-center justify-center text-mint">
                        <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72" />
                        </svg>
                      </div>
                    </div>

                    {/* Small star badge at intersection */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-[#031c14] border border-mint/30 flex items-center justify-center shadow-md z-20">
                      <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-mint" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </Container>
    </section>
  );
}
