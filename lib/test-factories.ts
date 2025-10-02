/**
 * Test data factories for unit testing
 * These factories create mock data that works with the Supabase mocks
 * Use these in your test files to create consistent, realistic test data
 */

import {
  createTestActivity,
  createTestEvent,
  createTestEventAttendee,
  createTestEventOrganizer,
  createTestFriendship,
  createTestFriendshipInvite,
  createTestPlace,
  createTestUser,
  type TestActivity,
  type TestEvent,
  type TestEventAttendee,
  type TestEventOrganizer,
  type TestEventWithDetails,
  type TestFriendship,
  type TestFriendshipInvite,
  type TestPlace,
  type TestUser,
} from "../lib/test-data";

// Mock Supabase error type
export interface MockSupabaseError {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

// Mock client type for testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MockSupabaseClient = jest.Mocked<any>;

// Mock Supabase response types
export interface MockSupabaseResponse<T> {
  data: T | null;
  error: MockSupabaseError | null;
}

export interface MockSupabaseListResponse<T> {
  data: T[] | null;
  error: MockSupabaseError | null;
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
  ): MockSupabaseResponse<null> {
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
   * Creates a mock event with database structure
   */
  static createEvent(creatorId: string, overrides: Partial<TestEvent> = {}) {
    const event = createTestEvent(creatorId, overrides);
    return {
      ...event,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Creates a mock event attendee with database structure
   */
  static createEventAttendee(
    eventId: string,
    userId: string,
    overrides: Partial<TestEventAttendee> = {}
  ) {
    const attendee = createTestEventAttendee(eventId, userId, overrides);
    return {
      ...attendee,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Creates a mock event organizer with database structure
   */
  static createEventOrganizer(
    eventId: string,
    userId: string,
    overrides: Partial<TestEventOrganizer> = {}
  ) {
    const organizer = createTestEventOrganizer(eventId, userId, overrides);
    return {
      ...organizer,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Creates a mock event with full details including attendees and organizers
   */
  static createEventWithDetails(
    creatorId: string,
    attendeeIds: string[] = [],
    organizerIds: string[] = [],
    overrides: Partial<TestEventWithDetails> = {}
  ) {
    const event = this.createEvent(creatorId, overrides);
    const attendees = attendeeIds.map((userId) =>
      this.createEventAttendee(event.id, userId)
    );
    const organizers = [
      this.createEventOrganizer(event.id, creatorId, { role: "organizer" }),
      ...organizerIds.map((userId) =>
        this.createEventOrganizer(event.id, userId)
      ),
    ];

    const confirmedCount = attendees.filter(
      (a) => a.status === "confirmed"
    ).length;

    return {
      ...event,
      creator_profile: this.createProfile(creatorId),
      attendees,
      organizers,
      attendee_count: attendees.length,
      confirmed_count: confirmedCount,
      ...overrides,
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
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(MockSupabaseFactory.emptyResponse()),
      maybeSingle: jest
        .fn()
        .mockResolvedValue(MockSupabaseFactory.emptyResponse()),
      mockResolvedValue: jest.fn(),
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
    mockClient: MockSupabaseClient,
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
  static mockUnauthenticatedUser(mockClient: MockSupabaseClient) {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated", code: "UNAUTHENTICATED" },
    });
  }

  /**
   * Configures mock to return friendship data
   */
  static mockFriendships(
    mockClient: MockSupabaseClient,
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
    mockClient: MockSupabaseClient,
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
    mockClient: MockSupabaseClient,
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
    mockClient: MockSupabaseClient,
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
  static mockSuccessfulInsert(
    mockClient: MockSupabaseClient,
    returnData?: unknown
  ) {
    const mockQuery = mockClient.from().insert();
    mockQuery.mockResolvedValue(
      MockSupabaseFactory.successResponse(returnData || { id: "new-id" })
    );
    return mockQuery;
  }

  /**
   * Configures mock for successful update operation
   */
  static mockSuccessfulUpdate(
    mockClient: MockSupabaseClient,
    returnData?: unknown
  ) {
    const mockQuery = mockClient.from().update();
    mockQuery.mockResolvedValue(
      MockSupabaseFactory.successResponse(returnData || { id: "updated-id" })
    );
    return mockQuery;
  }

  /**
   * Configures mock for error response
   */
  static mockError(
    mockClient: MockSupabaseClient,
    errorMessage: string,
    errorCode?: string
  ) {
    const mockQuery = mockClient.from().select();
    mockQuery.mockResolvedValue(
      MockSupabaseFactory.errorResponse(errorMessage, errorCode)
    );
    return mockQuery;
  }

  /**
   * Configures mock to return event data
   */
  static mockEvents(
    mockClient: MockSupabaseClient,
    events: ReturnType<typeof TestDataFactory.createEvent>[]
  ) {
    const mockQuery = mockClient.from().select();
    mockQuery.order.mockResolvedValue(
      MockSupabaseFactory.successListResponse(events)
    );
    return mockQuery;
  }

  /**
   * Configures mock to return event attendees
   */
  static mockEventAttendees(
    mockClient: MockSupabaseClient,
    attendees: ReturnType<typeof TestDataFactory.createEventAttendee>[]
  ) {
    const mockQuery = mockClient.from().select();
    mockQuery.mockResolvedValue(
      MockSupabaseFactory.successListResponse(attendees)
    );
    return mockQuery;
  }

  /**
   * Configures mock to return event organizers
   */
  static mockEventOrganizers(
    mockClient: MockSupabaseClient,
    organizers: ReturnType<typeof TestDataFactory.createEventOrganizer>[]
  ) {
    const mockQuery = mockClient.from().select();
    mockQuery.mockResolvedValue(
      MockSupabaseFactory.successListResponse(organizers)
    );
    return mockQuery;
  }

  /**
   * Creates a comprehensive mock setup for event data functions
   */
  static mockEventDataFunction(
    mockClient: MockSupabaseClient,
    config: {
      user?: ReturnType<typeof TestDataFactory.createAuthUser>;
      friendships?: ReturnType<typeof TestDataFactory.createFriendship>[];
      events?: ReturnType<typeof TestDataFactory.createEvent>[];
      attendees?: ReturnType<typeof TestDataFactory.createEventAttendee>[];
      organizers?: ReturnType<typeof TestDataFactory.createEventOrganizer>[];
    }
  ) {
    const {
      user = TestDataFactory.createAuthUser(),
      friendships = [],
      events = [],
      attendees = [],
      organizers = [],
    } = config;

    // Mock authentication
    TestHelpers.mockAuthUser(mockClient, user);

    // Create a queue of mock queries to be returned in order
    const mockQueries: any[] = [];

    // Mock friendships query if provided
    if (friendships.length > 0 || config.friendships !== undefined) {
      const friendshipsQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest
          .fn()
          .mockResolvedValue(
            MockSupabaseFactory.successListResponse(friendships)
          ),
      };
      mockQueries.push(friendshipsQuery);
    }

    // Mock events query
    const eventsQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnValue({
        order: jest
          .fn()
          .mockResolvedValue(MockSupabaseFactory.successListResponse(events)),
      }),
    };
    mockQueries.push(eventsQuery);

    // Mock attendees queries for each event
    events.forEach(() => {
      const attendeesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest
          .fn()
          .mockResolvedValue(
            MockSupabaseFactory.successListResponse(attendees)
          ),
      };
      mockQueries.push(attendeesQuery);
    });

    // Mock organizers queries for each event
    events.forEach(() => {
      const organizersQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest
          .fn()
          .mockResolvedValue(
            MockSupabaseFactory.successListResponse(organizers)
          ),
      };
      mockQueries.push(organizersQuery);
    });

    // Set up mockClient.from to return queries in order
    let queryIndex = 0;
    mockClient.from.mockImplementation(() => {
      const query =
        mockQueries[queryIndex] || TestHelpers.createDefaultMockQuery();
      queryIndex++;
      return query;
    });

    return { user, mockQueries };
  }

  /**
   * Creates a comprehensive mock setup for getMyEvents function
   */
  static mockMyEventsFunction(
    mockClient: MockSupabaseClient,
    config: {
      user?: ReturnType<typeof TestDataFactory.createAuthUser>;
      attendingEvents?: Array<{
        event_id: string;
        status: string;
        events: ReturnType<typeof TestDataFactory.createEvent>;
      }>;
      organizingEvents?: Array<{
        event_id: string;
        role: string;
        events: ReturnType<typeof TestDataFactory.createEvent>;
      }>;
      attendeeCounts?: Record<string, number>;
    }
  ) {
    const {
      user = TestDataFactory.createAuthUser(),
      attendingEvents = [],
      organizingEvents = [],
      attendeeCounts = {},
    } = config;

    // Mock authentication
    TestHelpers.mockAuthUser(mockClient, user);

    const mockQueries: any[] = [];

    // Mock attending events query
    const attendingQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest
        .fn()
        .mockResolvedValue(
          MockSupabaseFactory.successListResponse(attendingEvents)
        ),
    };
    mockQueries.push(attendingQuery);

    // Mock organizing events query
    const organizingQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest
        .fn()
        .mockResolvedValue(
          MockSupabaseFactory.successListResponse(organizingEvents)
        ),
    };
    mockQueries.push(organizingQuery);

    // Mock attendee count queries for each unique event
    const allEventIds = new Set([
      ...attendingEvents.map((e) => e.event_id),
      ...organizingEvents.map((e) => e.event_id),
    ]);

    allEventIds.forEach((eventId) => {
      const count = attendeeCounts[eventId] || 1;
      const attendeeCountQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest
          .fn()
          .mockResolvedValue(
            MockSupabaseFactory.successListResponse(
              Array.from({ length: count }, () => ({ status: "confirmed" }))
            )
          ),
      };
      mockQueries.push(attendeeCountQuery);
    });

    // Set up mockClient.from to return queries in order
    let queryIndex = 0;
    mockClient.from.mockImplementation(() => {
      const query =
        mockQueries[queryIndex] || TestHelpers.createDefaultMockQuery();
      queryIndex++;
      return query;
    });

    return { user, mockQueries };
  }

  /**
   * Creates a default mock query with all common methods
   */
  static createDefaultMockQuery() {
    return {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(MockSupabaseFactory.emptyResponse()),
      maybeSingle: jest
        .fn()
        .mockResolvedValue(MockSupabaseFactory.emptyResponse()),
      mockResolvedValue: jest
        .fn()
        .mockResolvedValue(MockSupabaseFactory.emptyListResponse()),
    };
  }

  /**
   * Enhanced mock for event creation with organizer insertion
   */
  static mockEventCreation(
    mockClient: MockSupabaseClient,
    eventId: string,
    shouldFailOrganizer = false
  ) {
    // Mock event insertion
    const insertQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue(
          MockSupabaseFactory.successResponse({ id: eventId })
        ),
    };

    // Mock organizer insertion
    const organizerQuery = {
      insert: jest
        .fn()
        .mockResolvedValue(
          shouldFailOrganizer
            ? MockSupabaseFactory.errorResponse("Organizer insertion failed")
            : MockSupabaseFactory.successResponse(null)
        ),
    };

    let queryIndex = 0;
    const queries = [insertQuery, organizerQuery];

    mockClient.from.mockImplementation(() => {
      const query = queries[queryIndex] || TestHelpers.createDefaultMockQuery();
      queryIndex++;
      return query;
    });

    return { insertQuery, organizerQuery };
  }

  /**
   * Enhanced mock for event joining with capacity and attendance checks
   */
  static mockEventJoining(
    mockClient: MockSupabaseClient,
    config: {
      event: ReturnType<typeof TestDataFactory.createEvent>;
      existingAttendance?: any;
      attendeeCount?: number;
      shouldSucceed?: boolean;
    }
  ) {
    const {
      event,
      existingAttendance = null,
      attendeeCount = 0,
      shouldSucceed = true,
    } = config;

    const mockQueries: any[] = [];

    // Event lookup query
    const eventQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue(MockSupabaseFactory.successResponse(event)),
    };
    mockQueries.push(eventQuery);

    // Existing attendance check
    const attendanceCheckQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue(
              existingAttendance
                ? MockSupabaseFactory.successResponse(existingAttendance)
                : MockSupabaseFactory.errorResponse("Not found", "PGRST116")
            ),
        }),
      }),
    };
    mockQueries.push(attendanceCheckQuery);

    // Capacity check
    const capacityQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({
        eq: jest
          .fn()
          .mockResolvedValue(
            MockSupabaseFactory.successListResponse(
              Array.from({ length: attendeeCount }, (_, i) => ({
                id: `att-${i}`,
              }))
            )
          ),
      }),
    };
    mockQueries.push(capacityQuery);

    // Join insertion
    const joinQuery = {
      insert: jest
        .fn()
        .mockResolvedValue(
          shouldSucceed
            ? MockSupabaseFactory.successResponse({ event_id: event.id })
            : MockSupabaseFactory.errorResponse("Join failed")
        ),
    };
    mockQueries.push(joinQuery);

    // Set up mockClient.from to return queries in order
    let queryIndex = 0;
    mockClient.from.mockImplementation(() => {
      const query =
        mockQueries[queryIndex] || TestHelpers.createDefaultMockQuery();
      queryIndex++;
      return query;
    });

    return { mockQueries };
  }

  /**
   * Mock organizer insertion for event creation
   */
  static mockOrganizerInsertion(
    mockClient: MockSupabaseClient,
    shouldFail = false
  ) {
    const organizerQuery = {
      insert: jest
        .fn()
        .mockResolvedValue(
          shouldFail
            ? MockSupabaseFactory.errorResponse("Organizer insertion failed")
            : MockSupabaseFactory.successResponse(null)
        ),
    };
    return organizerQuery;
  }

  /**
   * Reset mock client to clean state
   */
  static resetMockClient(mockClient: MockSupabaseClient) {
    jest.clearAllMocks();
    mockClient.from.mockImplementation(() =>
      TestHelpers.createDefaultMockQuery()
    );
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: TestDataFactory.createAuthUser() },
      error: null,
    });
  }

  /**
   * Enhanced error scenarios for testing
   */
  static mockNetworkError(mockClient: MockSupabaseClient) {
    mockClient.auth.getUser.mockRejectedValue(new Error("Network error"));
  }

  static mockDatabaseError(
    mockClient: MockSupabaseClient,
    message = "Database error"
  ) {
    const errorQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue(MockSupabaseFactory.errorResponse(message)),
      mockResolvedValue: jest
        .fn()
        .mockResolvedValue(MockSupabaseFactory.errorResponse(message)),
    };
    mockClient.from.mockReturnValue(errorQuery);
  }
}

// Enhanced mock patterns for complex scenarios
export class AdvancedMockPatterns {
  /**
   * Creates a complete mock scenario for event management
   */
  static createEventManagementScenario(
    mockClient: MockSupabaseClient,
    scenario: {
      currentUser: ReturnType<typeof TestDataFactory.createAuthUser>;
      friends: ReturnType<typeof TestDataFactory.createAuthUser>[];
      events: ReturnType<typeof TestDataFactory.createEvent>[];
      userAttendance: Record<string, "attending" | "organizing" | "none">;
    }
  ) {
    const { currentUser, friends, events, userAttendance } = scenario;

    // Create friendships
    const friendships = friends.map((friend) =>
      TestDataFactory.createFriendship(currentUser.id, friend.id)
    );

    // Create attendance and organizer data based on scenario
    const attendees: ReturnType<typeof TestDataFactory.createEventAttendee>[] =
      [];
    const organizers: ReturnType<
      typeof TestDataFactory.createEventOrganizer
    >[] = [];

    events.forEach((event) => {
      const attendance = userAttendance[event.id] || "none";

      if (attendance === "attending") {
        attendees.push(
          TestDataFactory.createEventAttendee(event.id, currentUser.id, {
            status: "confirmed",
          })
        );
      } else if (attendance === "organizing") {
        organizers.push(
          TestDataFactory.createEventOrganizer(event.id, currentUser.id, {
            role: "organizer",
          })
        );
      }

      // Add some random attendees for capacity testing
      for (let i = 0; i < 3; i++) {
        attendees.push(
          TestDataFactory.createEventAttendee(event.id, `random-user-${i}`, {
            status: "confirmed",
          })
        );
      }
    });

    return {
      currentUser,
      friends,
      friendships,
      events,
      attendees,
      organizers,
      setupMocks: () => {
        TestHelpers.mockEventDataFunction(mockClient, {
          user: currentUser,
          friendships,
          events,
          attendees,
          organizers,
        });
      },
    };
  }

  /**
   * Creates a scenario with realistic event data and complex relationships
   */
  static createRealisticEventScenario() {
    const users = Array.from({ length: 5 }, (_, i) =>
      TestDataFactory.createAuthUser({
        name: [
          `Max Müller`,
          `Anna Schmidt`,
          `David Fischer`,
          `Lisa Weber`,
          `Tom Bauer`,
        ][i],
        email: [
          `max@test.com`,
          `anna@test.com`,
          `david@test.com`,
          `lisa@test.com`,
          `tom@test.com`,
        ][i],
      })
    );

    const currentUser = users[0];
    const friends = users.slice(1, 4); // 3 friends

    const events = [
      TestDataFactory.createEvent(friends[0].id, {
        title: "Advanced Algorithms Study Group",
        category: "study",
        date: "2025-12-15",
        start_time: "14:00",
        is_public: true,
        max_attendees: 15,
      }),
      TestDataFactory.createEvent(friends[1].id, {
        title: "Munich Tech Professionals Meetup",
        category: "networking",
        date: "2025-11-20",
        start_time: "18:30",
        is_public: true,
        max_attendees: 50,
      }),
      TestDataFactory.createEvent(currentUser.id, {
        title: "Private Workshop",
        category: "workshop",
        date: "2025-10-30",
        start_time: "09:00",
        is_public: false,
        max_attendees: 8,
      }),
      TestDataFactory.createEvent(friends[2].id, {
        title: "Weekend Hackathon",
        category: "social",
        date: "2025-11-15",
        start_time: "10:00",
        is_public: true,
        max_attendees: 30,
      }),
    ];

    const userAttendance: Record<string, "attending" | "organizing" | "none"> =
      {
        [events[0].id]: "attending", // Attending friend's study group
        [events[1].id]: "none", // Not involved in networking event
        [events[2].id]: "organizing", // Organizing own workshop
        [events[3].id]: "attending", // Attending hackathon
      };

    return {
      users,
      currentUser,
      friends,
      events,
      userAttendance,
    };
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

// Event test data
export const TEST_EVENT_1 = TestDataFactory.createEvent(TEST_USER_1.id, {
  title: "Study Session Math",
  category: "study",
  is_public: true,
  max_attendees: 20,
});

export const TEST_EVENT_2 = TestDataFactory.createEvent(TEST_USER_2.id, {
  title: "Coding Workshop",
  category: "workshop",
  is_public: false,
  max_attendees: 10,
});

export const TEST_EVENT_ATTENDEE_1 = TestDataFactory.createEventAttendee(
  TEST_EVENT_1.id,
  TEST_USER_2.id,
  { status: "confirmed" }
);

export const TEST_EVENT_ORGANIZER_1 = TestDataFactory.createEventOrganizer(
  TEST_EVENT_1.id,
  TEST_USER_1.id,
  { role: "organizer" }
);

export const TEST_EVENT_WITH_DETAILS = TestDataFactory.createEventWithDetails(
  TEST_USER_1.id,
  [TEST_USER_2.id],
  [],
  { title: "Comprehensive Event Test" }
);
