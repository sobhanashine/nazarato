import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateUserNotificationSettings, updateUserPrivacy } from "./users";
import { supabaseAdmin } from "@/lib/supabase/server";

// Mock the server file that returns the supabaseAdmin client
vi.mock("@/lib/supabase/server", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
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
    eq: ReturnType<typeof vi.fn>;
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
});
