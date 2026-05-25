import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateUserNotificationSettings, updateUserPrivacy, getUserByUsername } from "./users";
import { supabaseAdmin } from "@/lib/supabase/server";

// Mock the server file that returns the supabaseAdmin client
vi.mock("@/lib/supabase/server", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    then: vi.fn(), // to allow awaiting the query
  };
  return {
    supabaseAdmin: () => mockSupabase,
  };
});

describe("Users Data Layer Settings Updates", () => {
  let mockSupabaseClient: {
    from: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    then: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSupabaseClient = supabaseAdmin() as unknown as typeof mockSupabaseClient;
    vi.clearAllMocks();
  });

  describe("updateUserNotificationSettings", () => {
    it("successfully updates notification settings in the database", async () => {
      mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
        Promise.resolve(callback({ data: null, error: null }))
      );

      const userId = "test-user-id";
      const updates = {
        notification_replies: false,
        notification_bookmarks: true,
      };

      await expect(
        updateUserNotificationSettings(userId, updates)
      ).resolves.not.toThrow();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("users");
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          notification_replies: false,
          notification_bookmarks: true,
        })
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("id", userId);
    });

    it("throws an error if DB update fails", async () => {
      mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
        Promise.resolve(callback({ data: null, error: { message: "Database update error" } }))
      );

      await expect(
        updateUserNotificationSettings("test-user-id", {
          notification_replies: true,
          notification_bookmarks: true,
        })
      ).rejects.toThrow("failed to update notification settings");
    });
  });

  describe("updateUserPrivacy", () => {
    it("successfully updates user public profile privacy settings", async () => {
      mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
        Promise.resolve(callback({ data: null, error: null }))
      );

      const userId = "test-user-id";
      const publicProfile = false;

      await expect(
        updateUserPrivacy(userId, publicProfile)
      ).resolves.not.toThrow();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("users");
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          public_profile: false,
        })
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("id", userId);
    });

    it("throws an error if privacy DB update fails", async () => {
      mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
        Promise.resolve(callback({ data: null, error: { message: "Database error" } }))
      );

      await expect(
        updateUserPrivacy("test-user-id", false)
      ).rejects.toThrow("failed to update privacy settings");
    });
  });

  describe("getUserByUsername", () => {
    it("successfully retrieves and parses a user by username", async () => {
      const mockDbUser = {
        id: "user-uuid-123",
        display_name: "سهراب سپهری",
        username: "sohrab",
        avatar_color: "#8B5CF6",
        role: "consumer",
        created_at: "2026-05-20T12:00:00Z",
        reviews_count: 5,
        helpful_votes_received: 10,
        reputation_score: 100,
        public_profile: true,
        notification_replies: true,
        notification_bookmarks: false,
      };

      mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
        Promise.resolve(callback({ data: mockDbUser, error: null }))
      );

      const result = await getUserByUsername("sohrab");

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("users");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("username", "sohrab");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("user-uuid-123");
      expect(result?.display_name).toBe("سهراب سپهری");
      expect(result?.username).toBe("sohrab");
      expect(result?.avatar_color).toBe("#8B5CF6");
      expect(result?.role).toBe("consumer");
      expect(result?.reviews_count).toBe(5);
      expect(result?.helpful_votes_received).toBe(10);
      expect(result?.reputation_score).toBe(100);
      expect(result?.public_profile).toBe(true);
      expect(result?.notification_replies).toBe(true);
      expect(result?.notification_bookmarks).toBe(false);
    });

    it("returns null if user is not found", async () => {
      mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
        Promise.resolve(callback({ data: null, error: null }))
      );

      const result = await getUserByUsername("nonexistent");
      expect(result).toBeNull();
    });

    it("throws an error if DB lookup fails", async () => {
      mockSupabaseClient.then.mockImplementation((callback: (value: unknown) => unknown) =>
        Promise.resolve(callback({ data: null, error: { message: "Database lookup failure" } }))
      );

      await expect(getUserByUsername("sohrab")).rejects.toThrow("user lookup failed");
    });
  });
});

