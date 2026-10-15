import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { ChatClient } from "@/components/chat/ChatClient";

export const metadata: Metadata = {
  title: "گفتگو با هوش مصنوعی – نظراتو",
  description: "اعتبار، نظرات و شکایت‌های فروشگاه‌های ایرانی را به صورت زنده با دستیار هوشمند نظراتو بررسی کنید.",
};

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex-grow h-[calc(100dvh-148px-env(safe-area-inset-bottom,0px))] md:h-[calc(100vh-80px)] overflow-hidden relative">
        <ChatClient />
      </main>
    </div>
  );
}
