import { Container } from "@/components/ui/Container";

export function PageBanner({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Container className="mb-6 sm:mb-9">
      <div className="border-b border-glass-border pb-6 pt-2 sm:pb-8">
        <h1 className="max-w-[24ch] text-[27px] font-extrabold leading-[1.5] text-strong sm:text-[36px]">{title}</h1>
        {subtitle && <p className="mt-3 max-w-[65ch] text-base leading-8 text-muted">{subtitle}</p>}
      </div>
    </Container>
  );
}
