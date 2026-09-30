import { describe, expect, it } from "vitest";
import { createChatSession, createChatId, updateAssistantMessage, type ChatSession } from "./chat-state";

describe("chat event state", () => {
  it("creates distinct session and message identities for consecutive interactions", () => {
    const first = createChatSession("یک پرسش درباره کافه");
    const second = createChatSession("یک پرسش درباره کافه");
    expect(first.id).not.toBe(second.id);
    expect(createChatId()).not.toBe(first.id);
    expect(first.messages).toEqual([]);
    expect(first.createdAt).toBeGreaterThan(0);
  });
  it("limits the session title while keeping shorter titles intact", () => {
    expect(createChatSession("پرسش کوتاه").title).toBe("پرسش کوتاه");
    expect(createChatSession("س".repeat(40)).title).toBe("س".repeat(24) + "...");
  });
  it("keeps prior streaming snapshots immutable and preserves other messages", () => {
    const sessions: ChatSession[] = [{ id: "session", title: "پرسش", createdAt: 1, messages: [{ id: "user", role: "user", text: "پرسش" }, { id: "reply", role: "model", text: "" }] }];
    const first = updateAssistantMessage(sessions, "session", "reply", { text: "سلام" });
    const second = updateAssistantMessage(first, "session", "reply", { text: "سلام دوباره", sources: [{ title: "منبع", url: "https://example.com" }] });
    expect(first[0].messages[1].text).toBe("سلام");
    expect(second[0].messages[1].text).toBe("سلام دوباره");
    expect(sessions[0].messages[1].text).toBe("");
    expect(second[0].messages[0]).toEqual(sessions[0].messages[0]);
  });
  it("does not alter another session or add a missing reply", () => {
    const sessions: ChatSession[] = [{ id: "other", title: "دیگر", createdAt: 1, messages: [] }];
    expect(updateAssistantMessage(sessions, "missing", "reply", { text: "متن" })).toEqual(sessions);
    expect(updateAssistantMessage(sessions, "other", "missing", { text: "متن" })).toEqual(sessions);
  });
});
