export interface SearchSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  sources?: SearchSource[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

export function createChatId(): string {
  return crypto.randomUUID();
}

export function createChatSession(title: string): ChatSession {
  return {
    id: createChatId(),
    title: title.slice(0, 24) + (title.length > 24 ? "..." : ""),
    messages: [],
    createdAt: Date.now(),
  };
}

export function updateAssistantMessage(
  sessions: ChatSession[],
  sessionId: string,
  messageId: string,
  update: Partial<Pick<ChatMessage, "text" | "sources">>,
): ChatSession[] {
  return sessions.map((session) =>
    session.id === sessionId
      ? {
          ...session,
          messages: session.messages.map((message) =>
            message.id === messageId ? { ...message, ...update } : message,
          ),
        }
      : session,
  );
}
