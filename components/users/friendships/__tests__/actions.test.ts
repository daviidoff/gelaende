import { createFriendshipInvite, acceptFriendshipInvite } from "../actions";
import { getFriendshipInvites, getFriendships } from "../data";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Mock modules
jest.mock("@/lib/supabase/server");
jest.mock("next/cache");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

describe("Friendship Invite Actions", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mock client for each test
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn(),
        order: jest.fn().mockReturnThis(),
      })),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe("createFriendshipInvite", () => {
    const mockUserId = "user-123";
    const mockRequesteeId = "user-456";

    beforeEach(() => {
      // Default successful auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    it("should successfully create a friendship invite", async () => {
      // Mock profile check - requestee exists
      const mockProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { profile_id: "profile-456" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockProfileChain);

      // Mock friendship check - no existing friendship
      const mockFriendshipChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipChain);

      // Mock invite check - no existing invite
      const mockInviteCheckChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInviteCheckChain);

      // Mock invite creation
      const mockInsertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { invite_id: "invite-789" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInsertChain);

      const result = await createFriendshipInvite(mockRequesteeId);

      expect(result).toEqual({
        success: true,
        message: "Friendship invite sent successfully!",
        inviteId: "invite-789",
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith("/protected");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/friends");
    });

    it("should reject if user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await createFriendshipInvite(mockRequesteeId);

      expect(result).toEqual({
        success: false,
        message: "Authentication required",
      });
    });

    it("should reject self-invitation", async () => {
      const result = await createFriendshipInvite(mockUserId);

      expect(result).toEqual({
        success: false,
        message: "You cannot send a friendship invite to yourself",
      });
    });

    it("should reject if requestee user does not exist", async () => {
      const mockProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "User not found" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockProfileChain);

      const result = await createFriendshipInvite(mockRequesteeId);

      expect(result).toEqual({
        success: false,
        message: "User not found",
      });
    });

    it("should reject if users are already friends", async () => {
      // Mock profile check - requestee exists
      const mockProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { profile_id: "profile-456" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockProfileChain);

      // Mock friendship check - existing friendship
      const mockFriendshipChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { friendship_id: "existing-friendship" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipChain);

      const result = await createFriendshipInvite(mockRequesteeId);

      expect(result).toEqual({
        success: false,
        message: "You are already friends with this user",
      });
    });

    it("should reject if invite already sent by current user", async () => {
      // Mock profile check - requestee exists
      const mockProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { profile_id: "profile-456" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockProfileChain);

      // Mock friendship check - no existing friendship
      const mockFriendshipChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipChain);

      // Mock invite check - existing invite from current user
      const mockInviteCheckChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            invite_id: "existing-invite",
            requester_id: mockUserId,
          },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInviteCheckChain);

      const result = await createFriendshipInvite(mockRequesteeId);

      expect(result).toEqual({
        success: false,
        message: "You have already sent a friendship invite to this user",
      });
    });

    it("should reject if invite already received from target user", async () => {
      // Mock profile check - requestee exists
      const mockProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { profile_id: "profile-456" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockProfileChain);

      // Mock friendship check - no existing friendship
      const mockFriendshipChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipChain);

      // Mock invite check - existing invite from target user
      const mockInviteCheckChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            invite_id: "existing-invite",
            requester_id: mockRequesteeId, // Different from current user
          },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInviteCheckChain);

      const result = await createFriendshipInvite(mockRequesteeId);

      expect(result).toEqual({
        success: false,
        message:
          "This user has already sent you a friendship invite. Please check your pending invites.",
      });
    });

    it("should handle database errors during invite creation", async () => {
      // Mock profile check - requestee exists
      const mockProfileChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { profile_id: "profile-456" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockProfileChain);

      // Mock friendship check - no existing friendship
      const mockFriendshipChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipChain);

      // Mock invite check - no existing invite
      const mockInviteCheckChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInviteCheckChain);

      // Mock invite creation failure
      const mockInsertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInsertChain);

      const result = await createFriendshipInvite(mockRequesteeId);

      expect(result).toEqual({
        success: false,
        message: "Failed to send friendship invite",
      });
    });

    it("should handle unexpected errors", async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Unexpected error")
      );

      const result = await createFriendshipInvite(mockRequesteeId);

      expect(result).toEqual({
        success: false,
        message: "An unexpected error occurred",
      });
    });
  });

  describe("getFriendshipInvites", () => {
    const mockUserId = "user-123";

    beforeEach(() => {
      // Default successful auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    it("should successfully fetch friendship invites", async () => {
      const mockReceivedInvites = [
        {
          invite_id: "invite-1",
          requester_id: "user-456",
          status: "pending",
          created_at: "2025-09-19T10:00:00Z",
          requester_profile: {
            profile_id: "profile-456",
            name: "John Doe",
            studiengang: "Computer Science",
            university: "TU Munich",
          },
        },
      ];

      const mockSentInvites = [
        {
          invite_id: "invite-2",
          requestee_id: "user-789",
          status: "pending",
          created_at: "2025-09-19T11:00:00Z",
          requestee_profile: {
            profile_id: "profile-789",
            name: "Jane Smith",
            studiengang: "Mathematics",
            university: "LMU Munich",
          },
        },
      ];

      // Mock received invites query
      const mockReceivedChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockReceivedChain.eq.mockReturnValueOnce(mockReceivedChain);
      mockReceivedChain.order.mockResolvedValue({
        data: [
          {
            invite_id: "invite-1",
            requester_id: "user-456",
            status: "pending",
            created_at: "2025-09-19T10:00:00Z",
          },
        ],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValueOnce(mockReceivedChain);

      // Mock sent invites query
      const mockSentChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockSentChain.eq.mockReturnValueOnce(mockSentChain);
      mockSentChain.order.mockResolvedValue({
        data: [
          {
            invite_id: "invite-2",
            requestee_id: "user-789",
            status: "pending",
            created_at: "2025-09-19T11:00:00Z",
          },
        ],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValueOnce(mockSentChain);

      // Mock profiles query
      const mockProfilesChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              profile_id: "profile-456",
              name: "John Doe",
              studiengang: "Computer Science",
              university: "TU Munich",
              user_id: "user-456",
            },
            {
              profile_id: "profile-789",
              name: "Jane Smith",
              studiengang: "Mathematics",
              university: "LMU Munich",
              user_id: "user-789",
            },
          ],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockProfilesChain);

      const result = await getFriendshipInvites();

      expect(result).toEqual({
        success: true,
        message: "Friendship invites fetched successfully",
        data: {
          received: [
            {
              invite_id: "invite-1",
              requester_id: "user-456",
              status: "pending",
              created_at: "2025-09-19T10:00:00Z",
              requester_profile: {
                profile_id: "profile-456",
                name: "John Doe",
                studiengang: "Computer Science",
                university: "TU Munich",
                user_id: "user-456",
              },
            },
          ],
          sent: [
            {
              invite_id: "invite-2",
              requestee_id: "user-789",
              status: "pending",
              created_at: "2025-09-19T11:00:00Z",
              requestee_profile: {
                profile_id: "profile-789",
                name: "Jane Smith",
                studiengang: "Mathematics",
                university: "LMU Munich",
                user_id: "user-789",
              },
            },
          ],
        },
      });
    });

    it("should reject if user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await getFriendshipInvites();

      expect(result).toEqual({
        success: false,
        message: "Authentication required",
        data: null,
      });
    });

    it("should handle database errors", async () => {
      // Mock received invites query error
      const mockReceivedChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockReceivedChain.eq.mockReturnValueOnce(mockReceivedChain);
      mockReceivedChain.order.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });
      mockSupabaseClient.from.mockReturnValueOnce(mockReceivedChain);

      // Mock sent invites query (won't be called due to error)
      const mockSentChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockSentChain.eq.mockReturnValueOnce(mockSentChain);
      mockSentChain.order.mockResolvedValue({
        data: [],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValueOnce(mockSentChain);

      const result = await getFriendshipInvites();

      expect(result).toEqual({
        success: false,
        message: "Error fetching friendship invites",
        data: null,
      });
    });

    it("should handle empty results", async () => {
      // Mock received invites query - empty
      const mockReceivedChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockReceivedChain.eq.mockReturnValueOnce(mockReceivedChain);
      mockReceivedChain.order.mockResolvedValue({
        data: [],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValueOnce(mockReceivedChain);

      // Mock sent invites query - empty
      const mockSentChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      mockSentChain.eq.mockReturnValueOnce(mockSentChain);
      mockSentChain.order.mockResolvedValue({
        data: [],
        error: null,
      });
      mockSupabaseClient.from.mockReturnValueOnce(mockSentChain);

      const result = await getFriendshipInvites();

      expect(result).toEqual({
        success: true,
        message: "Friendship invites fetched successfully",
        data: {
          received: [],
          sent: [],
        },
      });
    });

    it("should handle unexpected errors", async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Unexpected error")
      );

      const result = await getFriendshipInvites();

      expect(result).toEqual({
        success: false,
        message: "An unexpected error occurred",
        data: null,
      });
    });
  });

  describe("acceptFriendshipInvite", () => {
    const mockUserId = "user-123";
    const mockRequesterId = "user-456";
    const mockInviteId = "invite-789";

    beforeEach(() => {
      // Default successful auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    it("should successfully accept a friendship invite", async () => {
      // Mock invite retrieval
      const mockInviteChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            invite_id: mockInviteId,
            requester_id: mockRequesterId,
            requestee_id: mockUserId,
            status: "pending",
          },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInviteChain);

      // Mock friendship check - no existing friendship
      const mockFriendshipCheckChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipCheckChain);

      // Mock invite update
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { invite_id: mockInviteId },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockUpdateChain);

      // Mock friendship creation
      const mockFriendshipCreateChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { friendship_id: "friendship-123" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipCreateChain);

      const result = await acceptFriendshipInvite(mockInviteId);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Friendship invite accepted successfully!");
      expect(result.friendshipId).toBe("friendship-123");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/protected");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/friends");
    });

    it("should reject if user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Not authenticated"),
      });

      const result = await acceptFriendshipInvite(mockInviteId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Authentication required");
      expect(result.friendshipId).toBeUndefined();
    });

    it("should reject if invite not found", async () => {
      const mockInviteChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Invite not found"),
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInviteChain);

      const result = await acceptFriendshipInvite(mockInviteId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Friendship invite not found");
    });

    it("should reject if user is not the requestee", async () => {
      const mockInviteChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            invite_id: mockInviteId,
            requester_id: mockRequesterId,
            requestee_id: "different-user",
            status: "pending",
          },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInviteChain);

      const result = await acceptFriendshipInvite(mockInviteId);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "You are not authorized to accept this invite"
      );
    });

    it("should reject if invite is not pending", async () => {
      const mockInviteChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            invite_id: mockInviteId,
            requester_id: mockRequesterId,
            requestee_id: mockUserId,
            status: "accepted",
          },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInviteChain);

      const result = await acceptFriendshipInvite(mockInviteId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("This invite has already been accepted");
    });

    it("should reject if friendship already exists", async () => {
      // Mock invite retrieval
      const mockInviteChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            invite_id: mockInviteId,
            requester_id: mockRequesterId,
            requestee_id: mockUserId,
            status: "pending",
          },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInviteChain);

      // Mock friendship check - existing friendship found
      const mockFriendshipCheckChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { friendship_id: "existing-friendship" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipCheckChain);

      const result = await acceptFriendshipInvite(mockInviteId);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Friendship already exists between these users"
      );
    });

    it("should handle failure to update invite status", async () => {
      // Mock invite retrieval
      const mockInviteChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            invite_id: mockInviteId,
            requester_id: mockRequesterId,
            requestee_id: mockUserId,
            status: "pending",
          },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInviteChain);

      // Mock friendship check - no existing friendship
      const mockFriendshipCheckChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipCheckChain);

      // Mock invite update failure
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Update failed"),
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockUpdateChain);

      const result = await acceptFriendshipInvite(mockInviteId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to update invite status");
    });

    it("should handle failure to create friendship and revert invite", async () => {
      // Mock invite retrieval
      const mockInviteChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            invite_id: mockInviteId,
            requester_id: mockRequesterId,
            requestee_id: mockUserId,
            status: "pending",
          },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockInviteChain);

      // Mock friendship check - no existing friendship
      const mockFriendshipCheckChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipCheckChain);

      // Mock invite update success
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { invite_id: mockInviteId },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockUpdateChain);

      // Mock friendship creation failure
      const mockFriendshipCreateChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Friendship creation failed"),
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipCreateChain);

      // Mock revert invite update
      const mockRevertChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockRevertChain);

      const result = await acceptFriendshipInvite(mockInviteId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to create friendship");
    });

    it("should handle unexpected errors", async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Unexpected error")
      );

      const result = await acceptFriendshipInvite(mockInviteId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("An unexpected error occurred");
    });
  });

  describe("getFriendships", () => {
    const mockUserId = "user-123";

    beforeEach(() => {
      // Default successful auth
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    it("should successfully fetch all friendships with friend profiles", async () => {
      const mockFriendships = [
        {
          friendship_id: "friendship-1",
          user1_id: mockUserId,
          user2_id: "user-456",
          created_at: "2023-01-01T00:00:00Z",
          user1_profile: {
            profile_id: "profile-123",
            name: "Current User",
            studiengang: "Computer Science",
            university: "Test University",
            user_id: mockUserId,
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
          user2_profile: {
            profile_id: "profile-456",
            name: "Friend One",
            studiengang: "Mathematics",
            university: "Test University",
            user_id: "user-456",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        },
        {
          friendship_id: "friendship-2",
          user1_id: "user-789",
          user2_id: mockUserId,
          created_at: "2023-01-02T00:00:00Z",
          user1_profile: {
            profile_id: "profile-789",
            name: "Friend Two",
            studiengang: "Physics",
            university: "Another University",
            user_id: "user-789",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
          user2_profile: {
            profile_id: "profile-123",
            name: "Current User",
            studiengang: "Computer Science",
            university: "Test University",
            user_id: mockUserId,
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        },
      ];

      const mockFriendshipsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockFriendships,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipsChain);

      // Mock the profiles query
      const mockProfilesChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              profile_id: "profile-456",
              name: "Friend One",
              studiengang: "Mathematics",
              university: "Test University",
              user_id: "user-456",
              created_at: "2023-01-01T00:00:00Z",
              updated_at: "2023-01-01T00:00:00Z",
            },
            {
              profile_id: "profile-789",
              name: "Friend Two",
              studiengang: "Physics",
              university: "Another University",
              user_id: "user-789",
              created_at: "2023-01-01T00:00:00Z",
              updated_at: "2023-01-01T00:00:00Z",
            },
          ],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockProfilesChain);

      const result = await getFriendships();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Friendships fetched successfully");
      expect(result.data).toHaveLength(2);

      // Check first friend (user-456, because current user is user1)
      expect(result.data?.[0]).toEqual({
        profile_id: "profile-456",
        name: "Friend One",
        studiengang: "Mathematics",
        university: "Test University",
        user_id: "user-456",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        friendship_created_at: "2023-01-01T00:00:00Z",
      });

      // Check second friend (user-789, because current user is user2)
      expect(result.data?.[1]).toEqual({
        profile_id: "profile-789",
        name: "Friend Two",
        studiengang: "Physics",
        university: "Another University",
        user_id: "user-789",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        friendship_created_at: "2023-01-02T00:00:00Z",
      });

      // Verify the correct query was made
      expect(mockFriendshipsChain.select).toHaveBeenCalledWith("*");
      expect(mockFriendshipsChain.or).toHaveBeenCalledWith(
        `user1_id.eq.${mockUserId},user2_id.eq.${mockUserId}`
      );
      expect(mockFriendshipsChain.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });

    it("should return empty array when user has no friends", async () => {
      const mockFriendshipsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipsChain);

      const result = await getFriendships();

      expect(result.success).toBe(true);
      expect(result.message).toBe("No friendships found");
      expect(result.data).toEqual([]);
    });

    it("should handle null friendships data gracefully", async () => {
      const mockFriendshipsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipsChain);

      const result = await getFriendships();

      expect(result.success).toBe(true);
      expect(result.message).toBe("No friendships found");
      expect(result.data).toEqual([]);
    });

    it("should filter out friendships with missing profiles", async () => {
      const mockFriendships = [
        {
          friendship_id: "friendship-1",
          user1_id: mockUserId,
          user2_id: "user-456",
          created_at: "2023-01-01T00:00:00Z",
          user1_profile: {
            profile_id: "profile-123",
            name: "Current User",
            studiengang: "Computer Science",
            university: "Test University",
            user_id: mockUserId,
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
          user2_profile: {
            profile_id: "profile-456",
            name: "Friend One",
            studiengang: "Mathematics",
            university: "Test University",
            user_id: "user-456",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        },
        {
          friendship_id: "friendship-2",
          user1_id: "user-789",
          user2_id: mockUserId,
          created_at: "2023-01-02T00:00:00Z",
          user1_profile: null, // Missing profile
          user2_profile: {
            profile_id: "profile-123",
            name: "Current User",
            studiengang: "Computer Science",
            university: "Test University",
            user_id: mockUserId,
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        },
      ];

      const mockFriendshipsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockFriendships,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipsChain);

      // Mock the profiles query - only return one profile (the other is missing)
      const mockProfilesChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            {
              profile_id: "profile-456",
              name: "Friend One",
              studiengang: "Mathematics",
              university: "Test University",
              user_id: "user-456",
              created_at: "2023-01-01T00:00:00Z",
              updated_at: "2023-01-01T00:00:00Z",
            },
            // Note: profile for user-789 is missing
          ],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockProfilesChain);

      const result = await getFriendships();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Friendships fetched successfully");
      expect(result.data).toHaveLength(1); // Only one valid friendship
      expect(result.data?.[0].profile_id).toBe("profile-456");
    });

    it("should reject if user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await getFriendships();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Authentication required");
      expect(result.data).toBeUndefined();
    });

    it("should handle database error when fetching friendships", async () => {
      const mockFriendshipsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipsChain);

      const result = await getFriendships();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Error fetching friendships");
      expect(result.data).toBeUndefined();
    });

    it("should handle unexpected errors", async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Unexpected error")
      );

      const result = await getFriendships();

      expect(result.success).toBe(false);
      expect(result.message).toBe("An unexpected error occurred");
      expect(result.data).toBeUndefined();
    });

    it("should handle array profiles gracefully", async () => {
      const mockFriendships = [
        {
          friendship_id: "friendship-1",
          user1_id: mockUserId,
          user2_id: "user-456",
          created_at: "2023-01-01T00:00:00Z",
          user1_profile: {
            profile_id: "profile-123",
            name: "Current User",
            studiengang: "Computer Science",
            university: "Test University",
            user_id: mockUserId,
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
          user2_profile: [], // Array instead of object
        },
      ];

      const mockFriendshipsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockFriendships,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockFriendshipsChain);

      // Mock the profiles query - return empty to simulate no valid profiles found
      const mockProfilesChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [], // No profiles found
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockProfilesChain);

      const result = await getFriendships();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Friendships fetched successfully");
      expect(result.data).toEqual([]); // Should filter out invalid profiles
    });
  });
});
