import type { ReactNode } from "react";
import type { Business } from "@/lib/data/businesses";
import type { SearchArea } from "@/lib/local-area";
import { HeroSearch } from "@/components/sections/HeroSearch";
import { Container } from "@/components/ui/Container";

export function Hero({ businesses, area, children }: { businesses: Business[]; area: SearchArea; children?: ReactNode }) {
  return (
    <section aria-labelledby="home-title" className="border-b border-glass-border py-6 md:py-16">
      <Container>
        <div className="grid gap-5 md:gap-7 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
          <div>
            <p className="mb-2 text-[13px] font-medium text-forest">کافه و رستوران · رشت</p>
            <h1 id="home-title" className="text-[32px] font-bold leading-[1.4] text-strong sm:text-[44px] lg:text-[52px]">کجا در رشت بریم؟</h1>
            <p className="mt-2 max-w-md text-[16px] leading-7 text-muted">نشانی و تجربه‌ها را کنار هم ببین.</p>
          </div>
          <div className="w-full">
            <HeroSearch businesses={businesses} area={area} />
            {children}
          </div>
        </div>
      </Container>
    </section>
  );
}
