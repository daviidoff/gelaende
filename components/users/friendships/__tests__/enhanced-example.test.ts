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

      // Mock successful insert
      const expectedInvite = TestDataFactory.createFriendshipInvite(
        currentUser.id,
        targetUser.id
      );
      TestHelpers.mockSuccessfulInsert(mockSupabaseClient, expectedInvite);

      // Act
      const result = await createFriendshipInvite(targetUser.id);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        "friendship_invites"
      );
    });

    it("should handle errors gracefully", async () => {
      // Arrange
      const currentUser = TestDataFactory.createAuthUser();
      const targetUserId = "invalid-user-id";

      TestHelpers.mockAuthUser(mockSupabaseClient, currentUser);
      TestHelpers.mockError(
        mockSupabaseClient,
        "User not found",
        "USER_NOT_FOUND"
      );

      // Act
      const result = await createFriendshipInvite(targetUserId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Authentication required");
    });

    it("should prevent duplicate invites", async () => {
      // Arrange
      const currentUser = TestDataFactory.createAuthUser();
      const targetUser = TestDataFactory.createAuthUser();

      TestHelpers.mockAuthUser(mockSupabaseClient, currentUser);

      // Mock existing invite
      const existingInvite = TestDataFactory.createFriendshipInvite(
        currentUser.id,
        targetUser.id,
        { status: "pending" }
      );

      mockSupabaseClient
        .from()
        .select()
        .single.mockResolvedValue(
          MockSupabaseFactory.successResponse(existingInvite)
        );

      // Act
      const result = await createFriendshipInvite(targetUser.id);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("already exists");
    });
  });

  describe("getFriendships", () => {
    it("should return user friendships", async () => {
      // Arrange
      const currentUser = TestDataFactory.createAuthUser();
      const friend1 = TestDataFactory.createAuthUser();
      const friend2 = TestDataFactory.createAuthUser();

      const friendships = [
        TestDataFactory.createFriendship(currentUser.id, friend1.id),
        TestDataFactory.createFriendship(currentUser.id, friend2.id),
      ];

      TestHelpers.mockAuthUser(mockSupabaseClient, currentUser);
      TestHelpers.mockFriendships(mockSupabaseClient, friendships);

      // Act
      const result = await getFriendships();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual(friendships);
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
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        MockSupabaseFactory.errorResponse("Not authenticated")
      );

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

      // Mock successful invite creation
      const newInvite = TestDataFactory.createFriendshipInvite(
        user1.id,
        user2.id
      );
      TestHelpers.mockSuccessfulInsert(mockSupabaseClient, newInvite);

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
