"use client";

import { useState, useRef, useEffect } from "react";
import { SendIcon, ChatBubbleIcon, SearchIcon, MenuIcon } from "@/components/icons";
import { createChatId, createChatSession, updateAssistantMessage, type ChatMessage, type ChatSession, type SearchSource } from "./chat-state";

const suggestionChips = [
  "در منابع وب دربارهٔ کافه‌های گلسار چه اطلاعاتی هست؟",
  "نشانی و ساعت کاری یک کافه را از چند منبع بررسی کن.",
  "دربارهٔ منوی یک رستوران در رشت چه منابعی وجود دارد؟",
  "این دو منبع دربارهٔ یک مکان چه تفاوتی دارند؟",
];

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ChatClient() {
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadContainerRef = useRef<HTMLDivElement>(null);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
    
    // Load sessions from localStorage
    const saved = localStorage.getItem("nzr_chat_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (err) {
        console.error("Failed to parse chat sessions", err);
      }
    }
  }, []);

  // Save sessions to localStorage when they change
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("nzr_chat_sessions", JSON.stringify(sessions));
  }, [sessions, mounted]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId, isGenerating]);

  // Resolve current active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession ? activeSession.messages : [];

  const handleNewChat = () => {
    const newSession = createChatSession("گفتگوی جدید");
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setSidebarOpen(false);
    setError(null);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const filtered = sessions.filter((s) => s.id !== sessionId);
    setSessions(filtered);
    
    if (activeSessionId === sessionId) {
      if (filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
      } else {
        setActiveSessionId(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    await sendMessage(input.trim());
  };

  const handleChipClick = async (chipText: string) => {
    if (isGenerating) return;
    await sendMessage(chipText);
  };

  const sendMessage = async (messageText: string) => {
    setError(null);
    setInput("");
    setIsGenerating(true);

    let currentSessionId = activeSessionId;
    let currentSessions = [...sessions];

    // Create session if none exists
    if (!currentSessionId) {
      const newSession = createChatSession(messageText);
      currentSessionId = newSession.id;
      currentSessions = [newSession, ...currentSessions];
      setSessions(currentSessions);
      setActiveSessionId(currentSessionId);
    }

    const userMsg: ChatMessage = {
      id: createChatId(),
      role: "user",
      text: messageText
    };

    // Update session messages in state optimistically
    const updatedSessions = currentSessions.map((s) => {
      if (s.id === currentSessionId) {
        const isNew = s.messages.length === 0;
        return {
          ...s,
          title: isNew ? messageText.slice(0, 24) + (messageText.length > 24 ? "..." : "") : s.title,
          messages: [...s.messages, userMsg]
        };
      }
      return s;
    });

    setSessions(updatedSessions);

    const assistantMsgId = createChatId();
    let partialText = "";

    // Get current history for API (excluding the user message we just sent)
    const currentSessionMessages = updatedSessions.find((s) => s.id === currentSessionId)?.messages || [];
    const historyForApi = currentSessionMessages.slice(0, -1);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: historyForApi.map((m) => ({ role: m.role, text: m.text }))
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "خطا در دریافت پاسخ از سرور. لطفاً مجدداً تلاش کنید.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("جریان پاسخ از سرور برقرار نشد.");
      }

      // Add placeholder assistant message to session
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { id: assistantMsgId, role: "model", text: "", sources: [] }
                ]
              }
            : s
        )
      );

      const decoder = new TextDecoder();
      let done = false;
      let sseBuffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          sseBuffer += decoder.decode(value, { stream: !done });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            
            const jsonStr = trimmed.slice(6).trim();
            try {
              const data = JSON.parse(jsonStr);
              if (data.type === "text") {
                partialText += data.content;
                const nextText = partialText;
                setSessions((prev) =>
                  updateAssistantMessage(prev, currentSessionId, assistantMsgId, { text: nextText })
                );
              } else if (data.type === "sources") {
                const nextSources: SearchSource[] = data.content;
                setSessions((prev) =>
                  updateAssistantMessage(prev, currentSessionId, assistantMsgId, { sources: nextSources })
                );
              } else if (data.type === "error") {
                throw new Error(data.content);
              }
            } catch {
              // Ignore partial JSON packet errors
            }
          }
        }
      }
    } catch (err) {
      console.error("[chat-client] Error sending message:", err);
      const errMsg = err instanceof Error ? err.message : "خطای نامشخص رخ داد.";
      setError(errMsg);
      
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            const hasAssistant = s.messages.some((m) => m.id === assistantMsgId);
            if (hasAssistant) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, text: m.text + `\n\n⚠️ **خطا در اتصال:** ${errMsg}` }
                    : m
                )
              };
            } else {
              return {
                ...s,
                messages: [
                  ...s.messages,
                  {
                    id: assistantMsgId,
                    role: "model",
                    text: `⚠️ **خطا در اتصال:** ${errMsg}`
                  }
                ]
              };
            }
          }
          return s;
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const parseBoldText = (text: string) => {
    if (!text.includes("**")) return text;
    const parts = text.split("**");
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <strong key={index} className="font-extrabold text-mint select-text">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  const renderFormattedText = (text: string) => {
    return text.split("\n").map((line, lineIndex) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={lineIndex} className="h-2" />;

      const sectionHeaders = [
        "**بررسی اعتبار و شهرت کلی**",
        "**نقاط قوت**",
        "**نقاط ضعف و شکایت‌های رایج**",
        "**نظرات و دیدگاه‌های خریداران (به تفکیک منبع)**",
        "**نظرات و دیدگاه‌های خریداران (نقل‌قول‌های واقعی)**",
        "**توصیه نهایی نظراتو**",
        "**توصیه نهایی**",
        "**بررسی اعتبار**",
        "**نتیجه‌گیری**",
      ];

      const isHeader = sectionHeaders.some(
        (header) => trimmed.startsWith(header) || trimmed.endsWith(header)
      );

      if (isHeader) {
        const cleanHeader = trimmed.replace(/\*\*/g, "");
        return (
          <h3
            key={lineIndex}
            className="text-[15.5px] font-extrabold text-mint mt-5 mb-2.5 first:mt-1 flex items-center gap-2 border-b border-glass-border pb-1.5 select-text"
          >
            <span className="w-1.5 h-4 rounded-lg bg-mint  shrink-0" />
            {cleanHeader}
          </h3>
        );
      }

      if (trimmed.startsWith("###")) {
        const cleanHeader = trimmed.slice(3).trim();
        return (
          <h4
            key={lineIndex}
            className="text-[13.5px] font-extrabold text-mint/90 mt-4 mb-2 flex items-center gap-1.5 select-text"
          >
            <span className="w-1.5 h-3 rounded bg-mint/60 shrink-0" />
            {cleanHeader}
          </h4>
        );
      }

      if (trimmed.startsWith(">")) {
        const cleanText = trimmed.slice(1).trim();
        return (
          <blockquote
            key={lineIndex}
            className="border-r-4 border-mint/45 bg-mint/[0.04] p-3.5 my-3 rounded-l-xl text-[13.2px] italic text-muted leading-relaxed select-text "
          >
            {parseBoldText(cleanText)}
          </blockquote>
        );
      }

      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const cleanText = trimmed.slice(1).trim();
        return (
          <div key={lineIndex} className="flex items-start gap-2 my-2 ms-3 select-text">
            <span className="text-mint mt-1.5 select-none text-[8px] shrink-0">•</span>
            <span className="text-[14px] leading-relaxed text-strong">
              {parseBoldText(cleanText)}
            </span>
          </div>
        );
      }

      return (
        <p key={lineIndex} className="text-[14px] leading-relaxed text-strong my-1.5 select-text">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  // SSR Loading placeholder
  if (!mounted) {
    return (
      <div className="flex w-full h-full items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-mint/5 border border-mint/20 flex items-center justify-center text-mint ">
            <SearchIcon className="w-6 h-6" />
          </div>
          <div className="text-[13px] text-muted font-medium">در حال آماده‌سازی گفت‌وگو…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row w-full h-full overflow-hidden relative">
      
      {/* Sidebar - Collapsible drawer on mobile, fixed list on desktop */}
      <aside
        className={`fixed md:relative top-16 bottom-[calc(65px+env(safe-area-inset-bottom))] right-0 z-40 w-[260px] shrink-0 h-auto md:top-0 md:bottom-0 md:h-full border-l border-glass-border bg-paper  flex flex-col transition-transform duration-300 ease-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header with New Chat */}
        <div className="p-4 border-b border-glass-border">
          <button
            type="button"
            onClick={handleNewChat}
            className="min-h-11 min-w-11 flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg border border-mint/35 bg-mint/[0.08] hover:bg-mint/[0.16] hover:border-mint/55 text-[13px] font-extrabold text-mint transition-all duration-200 cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            شروع گفتگوی جدید
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          <div className="text-[12px] font-extrabold text-muted px-2.5 py-2 select-none">
            گفتگوهای اخیر
          </div>
          {sessions.length === 0 ? (
            <div className="text-[12px] text-muted text-center py-8 select-none">
              تاریخچه گفتگو خالی است
            </div>
          ) : (
            sessions.map((s) => {
              const active = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setSidebarOpen(false);
                    setError(null);
                  }}
                  className={`group relative flex items-center justify-between w-full p-3 rounded-lg border text-right cursor-pointer transition-all duration-200 ${
                    active
                      ? "bg-mint/8 border-mint/35 text-mint "
                      : "bg-transparent border-transparent text-strong hover:bg-glass hover:border-glass-border-hi"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden w-[82%]">
                    <ChatBubbleIcon className="w-4 h-4 shrink-0 opacity-60" />
                    <span className="text-[12.8px] font-semibold truncate select-none">
                      {s.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="min-h-11 min-w-11 p-1 rounded-lg text-muted hover:text-pomegr opacity-100"
                    aria-label="حذف گفتگو"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-glass-border bg-canvas">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-glass border border-glass-border">
            <SearchIcon className="w-4 h-4 text-mint shrink-0 mt-0.5" />
            <p className="text-[12px] text-muted leading-relaxed font-semibold">
              این نسخه در صورت اتصال سرویس، منابع وب را بررسی می‌کند. منابع را باز کن و اطلاعات را با هم بسنج.
            </p>
          </div>
        </div>
      </aside>

      {/* Drawer Overlay for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30  md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Chat Workspace */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-canvas">
        
        {/* Workspace Mobile Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-glass-border bg-paper  md:hidden shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="min-h-11 min-w-11 p-2 rounded-lg border border-glass-border bg-glass text-strong hover:bg-glass-hover"
            aria-label="منوی چت"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <span className="text-[13.5px] font-bold text-strong truncate max-w-[200px]">
            {activeSession ? activeSession.title : "گفت‌وگوی آزمایشی"}
          </span>
          <button
            type="button"
            onClick={handleNewChat}
            className="min-h-11 min-w-11 p-2 rounded-lg border border-mint/30 bg-mint/5 text-mint"
            aria-label="گفتگوی جدید"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </header>

        {/* Message Thread Scroll Container */}
        <div
          ref={threadContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto w-full space-y-6">
            
            {messages.length === 0 ? (
              /* Welcome Greeting Screen */
              <div className="min-h-[50vh] flex flex-col items-start justify-start py-4 text-start max-w-[550px] mx-auto">
                <div className="w-14 h-14 rounded-lg bg-mint/[0.06] border border-mint/20 flex items-center justify-center text-mint mb-5 ">
                  <SearchIcon className="w-6 h-6 " />
                </div>
                <h1 className="text-[22px] font-extrabold text-strong mb-2">بررسی آزمایشی منابع وب</h1>
                <p className="text-[14px] text-muted leading-7 mb-6">
                  این گفت‌وگو برای بررسی آزمایشی اطلاعات وب است. پیشنهاد شخصی بر پایهٔ تجربه‌های نظراتو هنوز در دست توسعه است.
                </p>

                <div className="w-full space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestionChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleChipClick(chip)}
                        className="min-h-11 min-w-11 text-right py-3 px-4 rounded-lg border border-glass-border bg-glass-strong hover:bg-mint/8 hover:border-mint/35 text-[14px] font-semibold text-strong transition-all duration-200 leading-relaxed cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Thread Messages */
              <div className="space-y-6">
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
                    >
                      <div
                        className={`max-w-[90%] sm:max-w-[85%] p-4 sm:p-5 rounded-lg ${
                          isUser
                            ? "bg-mint/5 border border-mint/25 text-strong rounded-te-none"
                            : "bg-glass border border-glass-border text-strong rounded-ts-none"
                        } `}
                      >
                        {/* Role & Verification Badge Header */}
                        <div className="flex items-center justify-between gap-4 mb-2.5 pb-2 border-b border-glass-border/30 select-none">
                          <span className="text-[12px] font-bold text-muted">
                            {isUser ? "کاربر" : "دستیار نظراتو"}
                          </span>
                          {!isUser && (
                            <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-md bg-mint/[0.08] border border-mint/20 text-[12px] font-bold text-mint">
                              <SearchIcon className="w-2.5 h-2.5" />
                              پاسخ آزمایشی؛ منابع را بررسی کن
                            </span>
                          )}
                        </div>

                        {/* Text Body */}
                        <div className="space-y-1">
                          {isUser ? (
                            <p className="text-[14.2px] leading-relaxed text-strong select-text whitespace-pre-line">
                              {msg.text}
                            </p>
                          ) : msg.text ? (
                            renderFormattedText(msg.text)
                          ) : (
                            /* Typings pulse dot */
                            <div className="flex items-center gap-1.5 py-2">
                              <span className="w-2 h-2 rounded-lg bg-mint animate-[bounce_1.4s_infinite_100ms]" />
                              <span className="w-2 h-2 rounded-lg bg-mint animate-[bounce_1.4s_infinite_300ms]" />
                              <span className="w-2 h-2 rounded-lg bg-mint animate-[bounce_1.4s_infinite_500ms]" />
                            </div>
                          )}
                        </div>

                        {/* Citations/References section */}
                        {!isUser && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-5 pt-3.5 border-t border-glass-border">
                            <div className="text-[12px] font-extrabold text-muted mb-2 flex items-center gap-1.5 select-none">
                              <span className="w-1.5 h-1.5 rounded-lg bg-mint " />
                              منابع این پاسخ:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((source, index) => {
                                let domain = "";
                                try {
                                  const urlObj = new URL(source.url);
                                  domain = urlObj.hostname.replace("www.", "");
                                } catch {
                                  domain = "منبع";
                                }
                                return (
                                  <a
                                    key={index}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-11 items-center gap-1 px-2.5 py-1.5 rounded-lg bg-canvas border border-glass-border text-[12px] text-mint hover:bg-mint/10 hover:border-mint/45 transition-all duration-200"
                                  >
                                    <span className="font-semibold truncate max-w-[150px]">{source.title}</span>
                                    <span className="text-[12px] text-muted">({domain})</span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Generation loader */}
                {isGenerating && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start w-full">
                    <div className="bg-glass border border-glass-border p-4 rounded-lg rounded-ts-none ">
                      <div className="flex items-center justify-between gap-4 mb-2.5 pb-2 border-b border-glass-border/30 select-none">
                        <span className="text-[12px] font-bold text-muted">دستیار نظراتو</span>
                        <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-md bg-mint/[0.08] border border-mint/20 text-[12px] font-bold text-mint">
                          <SearchIcon className="w-2.5 h-2.5 animate-spin" />
                          در حال دریافت پاسخ…
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 py-2">
                        <span className="w-2 h-2 rounded-lg bg-mint animate-[bounce_1.4s_infinite_100ms]" />
                        <span className="w-2 h-2 rounded-lg bg-mint animate-[bounce_1.4s_infinite_300ms]" />
                        <span className="w-2 h-2 rounded-lg bg-mint animate-[bounce_1.4s_infinite_500ms]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Panel & Grounding Disclosures */}
        <div className="shrink-0 p-4 border-t border-glass-border bg-paper">
          <div className="max-w-3xl mx-auto w-full space-y-2.5">
            {error && (
              <div className="text-[12.5px] font-semibold text-pomegr bg-pomegr/5 border border-pomegr/25 rounded-lg px-4 py-3 text-right">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="relative flex items-center w-full">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="نام مکان یا پرسش دربارهٔ منابع وب"
                disabled={isGenerating}
                className="min-h-11 text-[16px] w-full py-4 ps-12 pe-16 rounded-lg border border-glass-border bg-glass  font-semibold text-strong placeholder:text-muted focus:outline-none focus:border-mint/45  transition-all duration-200 disabled:opacity-50"
              />
              <div className="absolute right-4 text-muted pointer-events-none">
                <SearchIcon className="w-4 h-4" />
              </div>
              
              {/* Send action */}
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className={`min-h-11 min-w-11 absolute left-3 p-2.5 rounded-lg transition-all duration-250 flex items-center justify-center cursor-pointer ${
                  input.trim() && !isGenerating
                    ? "bg-forest text-white hover:opacity-90 border border-mint/20"
                    : "bg-glass border border-glass-border text-muted opacity-30 cursor-not-allowed"
                }`}
                aria-label="ارسال پیام"
              >
                <SendIcon className="w-4 h-4 transform rotate-180" />
              </button>
            </form>
            
            {/* Grounding and Data Provenance Disclaimer */}
            <p className="text-[12px] text-muted text-start leading-6 select-none">
              پاسخ آزمایشی است و می‌تواند اشتباه باشد. منبع وب، تجربهٔ تأییدشدهٔ مشتری محسوب نمی‌شود.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
