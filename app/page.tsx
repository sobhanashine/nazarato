import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { ChatClient } from "@/components/chat/ChatClient";
import { ReviewSheetAutoOpen } from "@/components/review/ReviewSheetAutoOpen";

export const metadata: Metadata = {
  title: "نظراتو – دستیار هوشمند خرید و سنجش اعتبار فروشگاه‌ها",
  description: "اعتبار، نظرات و شکایت‌های فروشگاه‌های ایرانی را به صورت زنده و با استفاده از هوش مصنوعی بررسی کنید.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex-grow h-[calc(100dvh-148px-env(safe-area-inset-bottom,0px))] md:h-[calc(100vh-80px)] overflow-hidden relative">
        <ChatClient />
      </main>
      <ReviewSheetAutoOpen />
    </div>
  );
}
