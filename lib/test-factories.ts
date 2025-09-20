/**
 * Test data factories for unit testing
 * These factories create mock data that works with the Supabase mocks
 * Use these in your test files to create consistent, realistic test data
 */

import {
  createTestUser,
  createTestPlace,
  createTestActivity,
  createTestFriendship,
  createTestFriendshipInvite,
  type TestUser,
  type TestPlace,
  type TestActivity,
  type TestFriendship,
  type TestFriendshipInvite,
} from "../lib/test-data";

// Mock Supabase response types
export interface MockSupabaseResponse<T> {
  data: T | null;
  error: any;
}

export interface MockSupabaseListResponse<T> {
  data: T[] | null;
  error: any;
}

// Factory for creating mock Supabase client responses
export class MockSupabaseFactory {
  /**
   * Creates a successful response with data
   */
  static successResponse<T>(data: T): MockSupabaseResponse<T> {
    return { data, error: null };
  }

  /**
   * Creates a successful list response with data
   */
  static successListResponse<T>(data: T[]): MockSupabaseListResponse<T> {
    return { data, error: null };
  }

  /**
   * Creates an error response
   */
  static errorResponse(
    message: string,
    code?: string
  ): MockSupabaseResponse<any> {
    return {
      data: null,
      error: {
        message,
        code: code || "ERROR",
        details: null,
        hint: null,
      },
    };
  }

  /**
   * Creates an empty response (no data found)
   */
  static emptyResponse<T>(): MockSupabaseResponse<T> {
    return { data: null, error: null };
  }

  /**
   * Creates an empty list response
   */
  static emptyListResponse<T>(): MockSupabaseListResponse<T> {
    return { data: [], error: null };
  }
}

// Test data factories with Supabase-compatible structure
export class TestDataFactory {
  /**
   * Creates a mock auth user response
   */
  static createAuthUser(overrides: Partial<TestUser> = {}) {
    const user = createTestUser(overrides);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      aud: "authenticated",
      role: "authenticated",
      email_confirmed_at: new Date().toISOString(),
      phone: null,
      confirmation_sent_at: null,
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Creates a mock profile with database structure
   */
  static createProfile(userId?: string, overrides: Partial<TestUser> = {}) {
    const user = createTestUser({ id: userId, ...overrides });
    return {
      profile_id: `profile-${user.id}`,
      name: user.name,
      studiengang: user.studiengang,
      university: user.university,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Creates a mock place with database structure
   */
  static createPlace(overrides: Partial<TestPlace> = {}) {
    const place = createTestPlace(overrides);
    return {
      ...place,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Creates a mock activity with database structure
   */
  static createActivity(
    userId: string,
    placeId: string,
    overrides: Partial<TestActivity> = {}
  ) {
    const activity = createTestActivity(userId, placeId, overrides);
    return {
      ...activity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Creates a mock friendship with database structure
   */
  static createFriendship(
    user1Id: string,
    user2Id: string,
    overrides: Partial<TestFriendship> = {}
  ) {
    const friendship = createTestFriendship(user1Id, user2Id, overrides);
    return {
      ...friendship,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Creates a mock friendship invite with database structure
   */
  static createFriendshipInvite(
    requesterId: string,
    requesteeId: string,
    overrides: Partial<TestFriendshipInvite> = {}
  ) {
    const invite = createTestFriendshipInvite(
      requesterId,
      requesteeId,
      overrides
    );
    return {
      ...invite,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Creates multiple test users
   */
  static createUsers(
    count: number
  ): ReturnType<typeof TestDataFactory.createProfile>[] {
    return Array.from({ length: count }, () => {
      const authUser = this.createAuthUser();
      return this.createProfile(authUser.id);
    });
  }

  /**
   * Creates multiple test places
   */
  static createPlaces(
    count: number
  ): ReturnType<typeof TestDataFactory.createPlace>[] {
    return Array.from({ length: count }, () => this.createPlace());
  }

  /**
   * Creates a complete test scenario for integration testing
   */
  static createTestScenario() {
    // Create users
    const user1 = this.createAuthUser({
      name: "Max Müller",
      email: "max@test.com",
    });
    const user2 = this.createAuthUser({
      name: "Anna Schmidt",
      email: "anna@test.com",
    });
    const user3 = this.createAuthUser({
      name: "David Fischer",
      email: "david@test.com",
    });

    const profile1 = this.createProfile(user1.id, { name: user1.name });
    const profile2 = this.createProfile(user2.id, { name: user2.name });
    const profile3 = this.createProfile(user3.id, { name: user3.name });

    // Create places
    const place1 = this.createPlace({ name: "Universitätsbibliothek" });
    const place2 = this.createPlace({ name: "Mensa Zentral" });

    // Create activities
    const activity1 = this.createActivity(user1.id, place1.place_id);
    const activity2 = this.createActivity(user2.id, place2.place_id);
    const activity3 = this.createActivity(user1.id, place2.place_id);

    // Create friendship
    const friendship = this.createFriendship(user1.id, user2.id);

    // Create friendship invite
    const invite = this.createFriendshipInvite(user1.id, user3.id);

    return {
      users: [user1, user2, user3],
      profiles: [profile1, profile2, profile3],
      places: [place1, place2],
      activities: [activity1, activity2, activity3],
      friendships: [friendship],
      invites: [invite],
    };
  }
}

// Helper functions for common test patterns
export class TestHelpers {
  /**
   * Sets up a mock Supabase client with common default behaviors
   */
  static createMockSupabaseClient() {
    const createMockQuery = () => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(MockSupabaseFactory.emptyResponse()),
      maybeSingle: jest
        .fn()
        .mockResolvedValue(MockSupabaseFactory.emptyResponse()),
      mockResolvedValue: jest.fn().mockReturnThis(),
    });

    return {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: TestDataFactory.createAuthUser() },
          error: null,
        }),
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
      },
      from: jest.fn(() => createMockQuery()),
    };
  }

  /**
   * Configures mock to return specific user data
   */
  static mockAuthUser(
    mockClient: any,
    user?: ReturnType<typeof TestDataFactory.createAuthUser>
  ) {
    const authUser = user || TestDataFactory.createAuthUser();
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: authUser },
      error: null,
    });
    return authUser;
  }

  /**
   * Configures mock to return unauthenticated state
   */
  static mockUnauthenticatedUser(mockClient: any) {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated", code: "UNAUTHENTICATED" },
    });
  }

  /**
   * Configures mock to return friendship data
   */
  static mockFriendships(
    mockClient: any,
    friendships: ReturnType<typeof TestDataFactory.createFriendship>[]
  ) {
    const mockQuery = mockClient.from().select();
    mockQuery.mockResolvedValue(
      MockSupabaseFactory.successListResponse(friendships)
    );
    return mockQuery;
  }

  /**
   * Configures mock to return friendship invite data
   */
  static mockFriendshipInvites(
    mockClient: any,
    invites: ReturnType<typeof TestDataFactory.createFriendshipInvite>[]
  ) {
    const mockQuery = mockClient.from().select();
    mockQuery.mockResolvedValue(
      MockSupabaseFactory.successListResponse(invites)
    );
    return mockQuery;
  }

  /**
   * Configures mock to return activity data
   */
  static mockActivities(
    mockClient: any,
    activities: ReturnType<typeof TestDataFactory.createActivity>[]
  ) {
    const mockQuery = mockClient.from().select();
    mockQuery.mockResolvedValue(
      MockSupabaseFactory.successListResponse(activities)
    );
    return mockQuery;
  }

  /**
   * Configures mock to return profile data
   */
  static mockProfile(
    mockClient: any,
    profile: ReturnType<typeof TestDataFactory.createProfile>
  ) {
    const mockQuery = mockClient.from().select();
    mockQuery.single.mockResolvedValue(
      MockSupabaseFactory.successResponse(profile)
    );
    return mockQuery;
  }

  /**
   * Configures mock for successful insert operation
   */
  static mockSuccessfulInsert(mockClient: any, returnData?: any) {
    const mockQuery = mockClient.from().insert();
    mockQuery.mockResolvedValue(
      MockSupabaseFactory.successResponse(returnData || { id: "new-id" })
    );
    return mockQuery;
  }

  /**
   * Configures mock for successful update operation
   */
  static mockSuccessfulUpdate(mockClient: any, returnData?: any) {
    const mockQuery = mockClient.from().update();
    mockQuery.mockResolvedValue(
      MockSupabaseFactory.successResponse(returnData || { id: "updated-id" })
    );
    return mockQuery;
  }

  /**
   * Configures mock for error response
   */
  static mockError(mockClient: any, errorMessage: string, errorCode?: string) {
    const mockQuery = mockClient.from().select();
    mockQuery.mockResolvedValue(
      MockSupabaseFactory.errorResponse(errorMessage, errorCode)
    );
    return mockQuery;
  }
}

// Export commonly used test data
export const TEST_USER_1 = TestDataFactory.createAuthUser({
  name: "Test User 1",
  email: "test1@example.com",
});
export const TEST_USER_2 = TestDataFactory.createAuthUser({
  name: "Test User 2",
  email: "test2@example.com",
});
export const TEST_PROFILE_1 = TestDataFactory.createProfile(TEST_USER_1.id, {
  name: TEST_USER_1.name,
});
export const TEST_PROFILE_2 = TestDataFactory.createProfile(TEST_USER_2.id, {
  name: TEST_USER_2.name,
});
export const TEST_PLACE_1 = TestDataFactory.createPlace({
  name: "Test Library",
});
export const TEST_PLACE_2 = TestDataFactory.createPlace({
  name: "Test Cafeteria",
});
export const TEST_ACTIVITY_1 = TestDataFactory.createActivity(
  TEST_USER_1.id,
  TEST_PLACE_1.place_id
);
export const TEST_FRIENDSHIP_1 = TestDataFactory.createFriendship(
  TEST_USER_1.id,
  TEST_USER_2.id
);
export const TEST_INVITE_1 = TestDataFactory.createFriendshipInvite(
  TEST_USER_1.id,
  TEST_USER_2.id
);
