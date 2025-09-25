import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { pingFriend } from "../pingActions";

// Mock modules
jest.mock("@/lib/supabase/server");
jest.mock("next/cache");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

describe("Ping Actions", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console.log to capture ping messages
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();

    // Create a fresh mock client for each test
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn(),
      })),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("pingFriend", () => {
    const mockCurrentUserId = "user-123";
    const mockFriendId = "user-456";

    beforeEach(() => {
      // Default successful auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockCurrentUserId } },
        error: null,
      });
    });

    it("should successfully ping a friend", async () => {
      // Mock friendship verification - friendship exists
      const mockFriendshipChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { friendship_id: "friendship-123" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipChain);

      // Mock friend profile retrieval
      const mockFriendProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: "John Doe" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendProfileChain);

      // Mock current user profile retrieval
      const mockCurrentUserProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: "Jane Smith" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockCurrentUserProfileChain);

      const result = await pingFriend(mockFriendId);

      expect(result).toEqual({
        success: true,
        message: "Pinged John Doe!",
      });

      // Verify friendship check was called with correct parameters
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("friendships");
      expect(mockFriendshipChain.or).toHaveBeenCalledWith(
        `and(user1_id.eq.${mockCurrentUserId},user2_id.eq.${mockFriendId}),and(user1_id.eq.${mockFriendId},user2_id.eq.${mockCurrentUserId})`
      );

      // Verify profiles were fetched
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("profiles");
      expect(mockFriendProfileChain.eq).toHaveBeenCalledWith(
        "user_id",
        mockFriendId
      );
      expect(mockCurrentUserProfileChain.eq).toHaveBeenCalledWith(
        "user_id",
        mockCurrentUserId
      );

      // Verify revalidation was called
      expect(mockRevalidatePath).toHaveBeenCalledWith("/map");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/friends");

      // Verify console log was called with ping message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("🔔 PING: Jane Smith pinged John Doe")
      );
    });

    it("should reject if user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await pingFriend(mockFriendId);

      expect(result).toEqual({
        success: false,
        message: "Authentication required",
      });
    });

    it("should reject if user tries to ping themselves", async () => {
      const result = await pingFriend(mockCurrentUserId);

      expect(result).toEqual({
        success: false,
        message: "You cannot ping yourself",
      });
    });

    it("should reject if friendship does not exist", async () => {
      // Mock friendship verification - no friendship found
      const mockFriendshipChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipChain);

      const result = await pingFriend(mockFriendId);

      expect(result).toEqual({
        success: false,
        message: "You can only ping friends",
      });
    });

    it("should handle friendship verification database error", async () => {
      // Mock friendship verification error
      const mockFriendshipChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipChain);

      const result = await pingFriend(mockFriendId);

      expect(result).toEqual({
        success: false,
        message: "Error verifying friendship",
      });
    });

    it("should handle friend profile not found", async () => {
      // Mock friendship verification - friendship exists
      const mockFriendshipChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { friendship_id: "friendship-123" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipChain);

      // Mock friend profile retrieval - not found
      const mockFriendProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Profile not found" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendProfileChain);

      const result = await pingFriend(mockFriendId);

      expect(result).toEqual({
        success: false,
        message: "Friend not found",
      });
    });

    it("should handle current user profile not found", async () => {
      // Mock friendship verification - friendship exists
      const mockFriendshipChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { friendship_id: "friendship-123" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipChain);

      // Mock friend profile retrieval - success
      const mockFriendProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: "John Doe" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendProfileChain);

      // Mock current user profile retrieval - not found
      const mockCurrentUserProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Profile not found" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockCurrentUserProfileChain);

      const result = await pingFriend(mockFriendId);

      expect(result).toEqual({
        success: false,
        message: "User profile not found",
      });
    });

    it("should handle unexpected errors", async () => {
      // Mock an unexpected error
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Unexpected database error")
      );

      const result = await pingFriend(mockFriendId);

      expect(result).toEqual({
        success: false,
        message: "An unexpected error occurred while sending ping",
      });
    });

    it("should verify correct friendship query format", async () => {
      // Mock friendship verification - friendship exists
      const mockFriendshipChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { friendship_id: "friendship-123" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipChain);

      // Mock profiles (minimal for this test)
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { name: "Friend" },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { name: "User" },
            error: null,
          }),
        });

      await pingFriend(mockFriendId);

      // Verify the friendship query uses the correct OR logic
      expect(mockFriendshipChain.or).toHaveBeenCalledWith(
        `and(user1_id.eq.${mockCurrentUserId},user2_id.eq.${mockFriendId}),and(user1_id.eq.${mockFriendId},user2_id.eq.${mockCurrentUserId})`
      );
    });

    it("should log ping message with correct format", async () => {
      // Mock all necessary calls for successful ping
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { friendship_id: "friendship-123" },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { name: "Alice Johnson" },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { name: "Bob Smith" },
            error: null,
          }),
        });

      await pingFriend(mockFriendId);

      // Verify ping message format
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /🔔 PING: Bob Smith pinged Alice Johnson \(user-456\) at \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/
        )
      );
    });
  });
});
