import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { ChatClient } from "@/components/chat/ChatClient";

export const metadata: Metadata = {
  title: "بررسی آزمایشی منابع وب — نظراتو",
  description: "مسیر آزمایشی گفت‌وگو دربارهٔ منابع وب؛ پیشنهاد شخصی محلی در حال توسعه است.",
};

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100dvh-72px-env(safe-area-inset-bottom))] flex-col overflow-hidden md:h-dvh">
      <Header />
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <ChatClient />
      </main>
    </div>
  );
}
