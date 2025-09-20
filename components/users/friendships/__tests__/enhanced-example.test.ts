/**
 * Example test file demonstrating how to use the test data utilities
 * This shows best practices for testing with the new factories and mocks
 */

import { createFriendshipInvite, getFriendships } from "../actions";
import { createClient } from "@/lib/supabase/server";
import {
  TestDataFactory,
  TestHelpers,
  MockSupabaseFactory,
} from "@/lib/test-factories";

// Mock modules
jest.mock("@/lib/supabase/server");
jest.mock("next/cache");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe("Friendship Actions - Enhanced Tests", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Create a fresh mock client using our test utilities
    mockSupabaseClient = TestHelpers.createMockSupabaseClient();
    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe("createFriendshipInvite", () => {
    it("should create a friendship invite successfully", async () => {
      // Arrange - Use test factories to create realistic data
      const currentUser = TestDataFactory.createAuthUser({
        email: "test@example.com",
      });
      const targetUser = TestDataFactory.createAuthUser({
        email: "friend@example.com",
      });

      // Mock auth user
      TestHelpers.mockAuthUser(mockSupabaseClient, currentUser);

      // Mock the profiles table query (requestee check)
      mockSupabaseClient.from.mockImplementation((table: string) => {
        const createMockQuery = () => ({
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          single: jest
            .fn()
            .mockResolvedValue(MockSupabaseFactory.emptyResponse()),
          maybeSingle: jest
            .fn()
            .mockResolvedValue(MockSupabaseFactory.emptyResponse()),
        });

        if (table === "profiles") {
          const query = createMockQuery();
          query.single.mockResolvedValue(
            MockSupabaseFactory.successResponse({ profile_id: "profile-1" })
          );
          return query;
        }
        if (table === "friendships") {
          const query = createMockQuery();
          query.maybeSingle.mockResolvedValue(
            MockSupabaseFactory.emptyResponse()
          );
          return query;
        }
        if (table === "friendship_invites") {
          const query = createMockQuery();
          // First call for checking existing invite
          query.maybeSingle.mockResolvedValueOnce(
            MockSupabaseFactory.emptyResponse()
          );
          // Second call for inserting new invite
          const expectedInvite = TestDataFactory.createFriendshipInvite(
            currentUser.id,
            targetUser.id
          );
          query.single.mockResolvedValueOnce(
            MockSupabaseFactory.successResponse(expectedInvite)
          );
          return query;
        }
        return createMockQuery();
      });

      // Act
      const result = await createFriendshipInvite(targetUser.id);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("profiles");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("friendships");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        "friendship_invites"
      );
    });

    it("should handle errors gracefully", async () => {
      // Arrange
      const currentUser = TestDataFactory.createAuthUser();
      const targetUserId = "invalid-user-id";

      TestHelpers.mockAuthUser(mockSupabaseClient, currentUser);

      // Mock that the profile lookup returns an error (user not found)
      mockSupabaseClient.from.mockImplementation((table: string) => {
        const createMockQuery = () => ({
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          single: jest
            .fn()
            .mockResolvedValue(
              MockSupabaseFactory.errorResponse("Profile not found")
            ),
          maybeSingle: jest
            .fn()
            .mockResolvedValue(MockSupabaseFactory.emptyResponse()),
        });

        if (table === "profiles") {
          const query = createMockQuery();
          query.single.mockResolvedValue(
            MockSupabaseFactory.errorResponse("Profile not found")
          );
          return query;
        }

        return createMockQuery();
      });

      // Act
      const result = await createFriendshipInvite(targetUserId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("User not found");
    });

    it("should prevent duplicate invites", async () => {
      // Arrange
      const currentUser = TestDataFactory.createAuthUser();
      const targetUser = TestDataFactory.createAuthUser();

      TestHelpers.mockAuthUser(mockSupabaseClient, currentUser);

      // Mock the implementation for duplicate invite scenario
      mockSupabaseClient.from.mockImplementation((table: string) => {
        const createMockQuery = () => ({
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          single: jest
            .fn()
            .mockResolvedValue(MockSupabaseFactory.emptyResponse()),
          maybeSingle: jest
            .fn()
            .mockResolvedValue(MockSupabaseFactory.emptyResponse()),
        });

        if (table === "profiles") {
          const query = createMockQuery();
          query.single.mockResolvedValue(
            MockSupabaseFactory.successResponse({ profile_id: "profile-1" })
          );
          return query;
        }
        if (table === "friendships") {
          const query = createMockQuery();
          query.maybeSingle.mockResolvedValue(
            MockSupabaseFactory.emptyResponse()
          );
          return query;
        }
        if (table === "friendship_invites") {
          const query = createMockQuery();
          // Mock existing invite found
          const existingInvite = TestDataFactory.createFriendshipInvite(
            currentUser.id,
            targetUser.id,
            { status: "pending" }
          );
          query.maybeSingle.mockResolvedValue(
            MockSupabaseFactory.successResponse(existingInvite)
          );
          return query;
        }
        return createMockQuery();
      });

      // Act
      const result = await createFriendshipInvite(targetUser.id);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("already sent");
    });
  });

  describe("getFriendships", () => {
    it("should return user friendships", async () => {
      // Arrange
      const currentUser = TestDataFactory.createAuthUser();
      const friend1 = TestDataFactory.createAuthUser();
      const friend2 = TestDataFactory.createAuthUser();

      const friendshipData = [
        {
          friendship_id: "friendship-1",
          user1_id: currentUser.id,
          user2_id: friend1.id,
          created_at: new Date().toISOString(),
          user1_profile: TestDataFactory.createProfile(currentUser.id),
          user2_profile: TestDataFactory.createProfile(friend1.id),
        },
        {
          friendship_id: "friendship-2",
          user1_id: currentUser.id,
          user2_id: friend2.id,
          created_at: new Date().toISOString(),
          user1_profile: TestDataFactory.createProfile(currentUser.id),
          user2_profile: TestDataFactory.createProfile(friend2.id),
        },
      ];

      TestHelpers.mockAuthUser(mockSupabaseClient, currentUser);

      // Mock the complex friendship query
      mockSupabaseClient.from.mockImplementation((table: string) => {
        const createMockQuery = () => ({
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest
            .fn()
            .mockResolvedValue(
              MockSupabaseFactory.successListResponse(friendshipData)
            ),
          single: jest
            .fn()
            .mockResolvedValue(MockSupabaseFactory.emptyResponse()),
          maybeSingle: jest
            .fn()
            .mockResolvedValue(MockSupabaseFactory.emptyResponse()),
        });

        if (table === "friendships") {
          return createMockQuery();
        }

        return createMockQuery();
      });

      // Act
      const result = await getFriendships();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it("should handle no friendships", async () => {
      // Arrange
      const currentUser = TestDataFactory.createAuthUser();

      TestHelpers.mockAuthUser(mockSupabaseClient, currentUser);
      TestHelpers.mockFriendships(mockSupabaseClient, []);

      // Act
      const result = await getFriendships();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it("should handle unauthenticated user", async () => {
      // Arrange - Mock no authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated", code: "UNAUTHENTICATED" },
      });

      // Act
      const result = await getFriendships();

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("Authentication required");
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete friendship workflow", async () => {
      // Arrange - Create a realistic test scenario
      const scenario = TestDataFactory.createTestScenario();
      const [user1, user2] = scenario.users;

      TestHelpers.mockAuthUser(mockSupabaseClient, user1);

      // Mock the complete friendship invite flow
      mockSupabaseClient.from.mockImplementation((table: string) => {
        const createMockQuery = () => ({
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          single: jest
            .fn()
            .mockResolvedValue(MockSupabaseFactory.emptyResponse()),
          maybeSingle: jest
            .fn()
            .mockResolvedValue(MockSupabaseFactory.emptyResponse()),
        });

        if (table === "profiles") {
          const query = createMockQuery();
          query.single.mockResolvedValue(
            MockSupabaseFactory.successResponse({ profile_id: "profile-1" })
          );
          return query;
        }
        if (table === "friendships") {
          const query = createMockQuery();
          query.maybeSingle.mockResolvedValue(
            MockSupabaseFactory.emptyResponse()
          );
          return query;
        }
        if (table === "friendship_invites") {
          const query = createMockQuery();
          // Check for existing invite - none found
          query.maybeSingle.mockResolvedValueOnce(
            MockSupabaseFactory.emptyResponse()
          );
          // Create new invite - success
          const newInvite = TestDataFactory.createFriendshipInvite(
            user1.id,
            user2.id
          );
          query.single.mockResolvedValueOnce(
            MockSupabaseFactory.successResponse(newInvite)
          );
          return query;
        }
        return createMockQuery();
      });

      // Act - Create invite
      const inviteResult = await createFriendshipInvite(user2.id);

      // Assert
      expect(inviteResult.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        "friendship_invites"
      );
    });
  });
});
