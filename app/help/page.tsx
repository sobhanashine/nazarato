import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { HowToReview } from "@/components/sections/HowToReview";

export const metadata: Metadata = { title: "راهنمای تجربه و انتخاب — نظراتو", description: "چطور اطلاعات یک مکان را بخوانیم و تجربه‌ای بنویسیم که به انتخاب بعدی کمک کند." };

export default function HelpPage() {
  return <>
    <Header />
    <Container><Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "راهنما" }]} /></Container>
    <main className="pb-12">
      <Container><p className="mb-2 text-sm font-semibold text-forest">راهنمای نظراتو</p><h1 className="max-w-[22ch] text-[30px] font-extrabold leading-[1.5] text-strong sm:text-[40px]">از اطلاعات مکان، تا تجربهٔ آدم‌ها.</h1><p className="mt-4 max-w-[65ch] text-base leading-8 text-muted">نام و نشانی، تجربهٔ مشتری و تأیید مالک سه چیز جدا هستند. اطلاعات اولیه برای آشنایی است؛ برای تصمیم، زمان و زمینهٔ تجربه‌ها را هم در نظر بگیر.</p></Container>
      <HowToReview />
    </main>
    <Footer />
  </>;
}
