import { searchUsers } from "../actions";
import { createClient } from "@/lib/supabase/server";

// Mock modules
jest.mock("@/lib/supabase/server");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe("User Actions", () => {
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
        ilike: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
      })),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe("searchUsers", () => {
    const mockUserId = "user-123";

    beforeEach(() => {
      // Mock successful authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });
    });

    it("should return error for search term less than 2 characters", async () => {
      const result = await searchUsers("a");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Search term must be at least 2 characters");
      expect(result.users).toEqual([]);
    });

    it("should return error for empty search term", async () => {
      const result = await searchUsers("");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Search term must be at least 2 characters");
      expect(result.users).toEqual([]);
    });

    it("should return error for whitespace-only search term", async () => {
      const result = await searchUsers("  ");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Search term must be at least 2 characters");
      expect(result.users).toEqual([]);
    });

    it("should return authentication error when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await searchUsers("John");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Authentication required");
      expect(result.users).toBeUndefined();
    });

    it("should successfully search users and exclude current user, friends, and pending invites", async () => {
      const searchTerm = "John";
      const mockFriendships = [
        { user1_id: mockUserId, user2_id: "friend-1" },
        { user1_id: "friend-2", user2_id: mockUserId },
      ];
      const mockInvites = [
        { requester_id: mockUserId, requestee_id: "pending-1" },
        { requester_id: "pending-2", requestee_id: mockUserId },
      ];
      const mockProfiles = [
        {
          profile_id: "profile-1",
          name: "John Doe",
          studiengang: "Computer Science",
          university: "TU Munich",
          user_id: "user-789",
        },
        {
          profile_id: "profile-2",
          name: "Johnny Smith",
          studiengang: null,
          university: "LMU Munich",
          user_id: "user-890",
        },
      ];

      // Mock friendships query
      const mockFriendshipsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: mockFriendships,
          error: null,
        }),
      };

      // Mock invites query
      const mockInvitesChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: mockInvites,
          error: null,
        }),
      };

      // Mock profiles search query
      const mockProfilesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockProfiles,
          error: null,
        }),
      };

      // Setup the mock call sequence
      mockSupabaseClient.from
        .mockReturnValueOnce(mockFriendshipsChain) // First call for friendships
        .mockReturnValueOnce(mockInvitesChain) // Second call for invites
        .mockReturnValueOnce(mockProfilesChain); // Third call for profiles

      const result = await searchUsers(searchTerm);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Found 2 users");
      expect(result.users).toEqual(mockProfiles);

      // Verify the calls
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("friendships");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        "friendship_invites"
      );
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("profiles");

      expect(mockProfilesChain.ilike).toHaveBeenCalledWith(
        "name",
        `%${searchTerm}%`
      );
      expect(mockProfilesChain.limit).toHaveBeenCalledWith(20);
    });

    it("should return empty results when no users match search", async () => {
      const searchTerm = "NonexistentUser";

      // Mock empty responses for friendships and invites
      const mockFriendshipsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockInvitesChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      // Mock empty profiles search
      const mockProfilesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockFriendshipsChain)
        .mockReturnValueOnce(mockInvitesChain)
        .mockReturnValueOnce(mockProfilesChain);

      const result = await searchUsers(searchTerm);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Found 0 users");
      expect(result.users).toEqual([]);
    });

    it("should handle database error when fetching friendships", async () => {
      const searchTerm = "John";

      // Mock friendships query error - simulate Promise.all result
      const mockFriendshipsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };

      // Mock invites query - successful
      const mockInvitesChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockFriendshipsChain)
        .mockReturnValueOnce(mockInvitesChain);

      const result = await searchUsers(searchTerm);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Error searching users");
    });

    it("should handle database error when searching profiles", async () => {
      const searchTerm = "John";

      // Mock successful friendships and invites queries
      const mockFriendshipsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockInvitesChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      // Mock profiles search error
      const mockProfilesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Search error" },
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockFriendshipsChain)
        .mockReturnValueOnce(mockInvitesChain)
        .mockReturnValueOnce(mockProfilesChain);

      const result = await searchUsers(searchTerm);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Error searching users");
    });

    it("should handle unexpected errors", async () => {
      const searchTerm = "John";

      // Mock unexpected error
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const result = await searchUsers(searchTerm);

      expect(result.success).toBe(false);
      expect(result.message).toBe("An unexpected error occurred");
    });

    it("should trim search term before processing", async () => {
      const searchTerm = "  John  ";

      // Mock empty responses
      const mockFriendshipsChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockInvitesChain = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockProfilesChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockFriendshipsChain)
        .mockReturnValueOnce(mockInvitesChain)
        .mockReturnValueOnce(mockProfilesChain);

      await searchUsers(searchTerm);

      // Verify that the search term was trimmed
      expect(mockProfilesChain.ilike).toHaveBeenCalledWith("name", "%John%");
    });
  });
});
