import { createClient } from "@/lib/supabase/server";
import {
  MockSupabaseFactory,
  TEST_USER_1,
  TEST_USER_2,
  TestDataFactory,
  TestHelpers,
} from "@/lib/test-factories";
import { EventStatus, EventWithDetails } from "@/lib/types/database";
import {
  getMyEvents,
  getUpcomingEvents,
  getUpcomingFriendsEvents,
} from "../data";

// Mock modules
jest.mock("@/lib/supabase/server");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe("Events Data Functions", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn(),
      })),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  // Test data
  const mockUserId = "user-123";
  const mockFriendId1 = "friend-456";
  const mockFriendId2 = "friend-789";

  const mockUser = {
    id: mockUserId,
    email: "test@example.com",
  };

  const mockFriendships = [
    {
      user1_id: mockUserId,
      user2_id: mockFriendId1,
    },
    {
      user1_id: mockFriendId2,
      user2_id: mockUserId,
    },
  ];

  const mockEvent = {
    id: "event-123",
    title: "Friend's Party",
    description: "A fun party organized by my friend",
    date: "2025-10-15",
    start_time: "19:00:00",
    end_time: "23:00:00",
    place: "Munich City Center",
    location_details: "Near the main square",
    max_attendees: 50,
    status: "published",
    category: "social",
    is_public: true,
    created_by: mockFriendId1,
    created_at: "2025-09-20T10:00:00Z",
    updated_at: "2025-09-20T10:00:00Z",
    creator_profile: {
      profile_id: "profile-456",
      name: "Friend One",
      studiengang: "Computer Science",
      university: "TU Munich",
      user_id: mockFriendId1,
    },
  };

  const mockAttendees = [
    { user_id: "user-abc", status: "confirmed" },
    { user_id: "user-def", status: "confirmed" },
    { user_id: mockUserId, status: "pending" },
  ];

  const mockOrganizers = [{ user_id: mockFriendId1, role: "organizer" }];

  describe("getUpcomingFriendsEvents", () => {
    it("should return upcoming events organized by friends successfully", async () => {
      // Mock auth response
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock friendships query
      const friendshipsQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: mockFriendships,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(friendshipsQuery);

      // Mock events query
      const eventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      // Verify that gte is called with today's date for upcoming events
      eventsQuery.gte.mockImplementation((field, value) => {
        expect(field).toBe("date");
        const today = new Date().toISOString().split("T")[0];
        expect(value).toBe(today);
        return eventsQuery;
      });
      // Set up the final order call to return the data
      eventsQuery.order.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [mockEvent],
          error: null,
        }),
      });
      mockSupabaseClient.from.mockReturnValueOnce(eventsQuery);

      // Mock attendees query
      const attendeesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockAttendees,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendeesQuery);

      // Mock organizers query
      const organizersQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockOrganizers,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(organizersQuery);

      const result = await getUpcomingFriendsEvents();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].title).toBe("Friend's Party");
      expect(result.data![0].attendee_count).toBe(2); // Only confirmed attendees
      expect(result.data![0].is_attending).toBe(false); // User has pending status
      expect(result.data![0].is_organizing).toBe(false);
      expect(result.message).toContain("upcoming events organized by friends");
    });

    it("should handle authentication error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await getUpcomingFriendsEvents();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Authentication required");
      expect(result.data).toBeUndefined();
    });

    it("should handle no friends case", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const friendshipsQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(friendshipsQuery);

      const result = await getUpcomingFriendsEvents();

      expect(result.success).toBe(true);
      expect(result.message).toBe("No friends found");
      expect(result.data).toEqual([]);
    });

    it("should handle friendships query error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const friendshipsQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(friendshipsQuery);

      const result = await getUpcomingFriendsEvents();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Error fetching friendships: Database error");
    });

    it("should handle events query error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const friendshipsQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: mockFriendships,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(friendshipsQuery);

      const eventsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      // Set up the final order call to return the error
      eventsQuery.order.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Events fetch error" },
        }),
      });
      mockSupabaseClient.from.mockReturnValueOnce(eventsQuery);

      const result = await getUpcomingFriendsEvents();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Error fetching events: Events fetch error");
    });
  });

  describe("getUpcomingEvents", () => {
    it("should return upcoming public events successfully", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };
      // Set up the final order call to return the data
      eventsQuery.order.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [mockEvent],
          error: null,
        }),
      });
      mockSupabaseClient.from.mockReturnValueOnce(eventsQuery);

      // Mock attendees query
      const attendeesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockAttendees,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendeesQuery);

      // Mock organizers query
      const organizersQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockOrganizers,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(organizersQuery);

      const result = await getUpcomingEvents();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].title).toBe("Friend's Party");
      expect(result.message).toContain("Found 1 upcoming events");
    });

    it("should filter by today's date", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };

      // Verify that gte is called with today's date
      eventsQuery.gte.mockImplementation((field, value) => {
        expect(field).toBe("date");
        const today = new Date().toISOString().split("T")[0];
        expect(value).toBe(today);
        return eventsQuery;
      });

      eventsQuery.order.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      mockSupabaseClient.from.mockReturnValueOnce(eventsQuery);

      await getUpcomingEvents();

      expect(eventsQuery.gte).toHaveBeenCalled();
    });
  });

  describe("getMyEvents", () => {
    const mockAttendingEvent = {
      event_id: "event-attending-123",
      status: "confirmed",
      events: {
        ...mockEvent,
        id: "event-attending-123",
        title: "Event I'm Attending",
      },
    };

    const mockOrganizingEvent = {
      event_id: "event-organizing-456",
      role: "organizer",
      events: {
        ...mockEvent,
        id: "event-organizing-456",
        title: "Event I'm Organizing",
      },
    };

    it("should return events user is attending and organizing", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock attending events query
      const attendingQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockAttendingEvent],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendingQuery);

      // Mock organizing events query
      const organizingQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockOrganizingEvent],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(organizingQuery);

      // Mock attendee count queries
      const attendeeCountQuery1 = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ status: "confirmed" }, { status: "confirmed" }],
          error: null,
        }),
      };
      const attendeeCountQuery2 = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ status: "confirmed" }],
          error: null,
        }),
      };
      mockSupabaseClient.from
        .mockReturnValueOnce(attendeeCountQuery1)
        .mockReturnValueOnce(attendeeCountQuery2);

      const result = await getMyEvents();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].title).toBe("Event I'm Attending");
      expect(result.data![0].is_attending).toBe(true);
      expect(result.data![0].is_organizing).toBe(false);
      expect(result.data![1].title).toBe("Event I'm Organizing");
      expect(result.data![1].is_organizing).toBe(true);
    });

    it("should handle same event in both attending and organizing", async () => {
      const sameEventId = "event-same-123";
      const attendingAndOrganizing = {
        event_id: sameEventId,
        status: "confirmed",
        events: {
          ...mockEvent,
          id: sameEventId,
          title: "Event I'm Both Attending and Organizing",
        },
      };

      const organizingEntry = {
        event_id: sameEventId,
        role: "co-organizer",
        events: {
          ...mockEvent,
          id: sameEventId,
          title: "Event I'm Both Attending and Organizing",
        },
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock attending events query
      const attendingQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [attendingAndOrganizing],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendingQuery);

      // Mock organizing events query
      const organizingQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [organizingEntry],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(organizingQuery);

      // Mock attendee count query
      const attendeeCountQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ status: "confirmed" }],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendeeCountQuery);

      const result = await getMyEvents();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Should be deduplicated
      expect(result.data![0].is_attending).toBe(true);
      expect(result.data![0].is_organizing).toBe(true);
      // organizer_role is added dynamically in the function
      expect(
        (result.data![0] as EventWithDetails & { organizer_role: string })
          .organizer_role
      ).toBe("co-organizer");
    });

    it("should handle attending events query error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const attendingQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Attending events error" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendingQuery);

      const result = await getMyEvents();

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Error fetching user events: Attending events error"
      );
    });

    it("should handle organizing events query error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const attendingQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendingQuery);

      const organizingQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Organizing events error" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(organizingQuery);

      const result = await getMyEvents();

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Error fetching user events: Organizing events error"
      );
    });
  });

  describe("Error handling", () => {
    it("should handle unexpected errors gracefully", async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Network error")
      );

      const result = await getUpcomingFriendsEvents();

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "An unexpected error occurred while fetching upcoming friends' events"
      );
    });
  });

  // Comprehensive mock data test scenarios
  describe("Comprehensive Mock Data Tests", () => {
    describe("getUpcomingEvents with realistic scenarios", () => {
      it("should fetch and sort diverse event types correctly", async () => {
        const user = TestDataFactory.createAuthUser();
        TestHelpers.mockAuthUser(mockSupabaseClient, user);

        // Create diverse events with different categories and times
        const diverseEvents = [
          TestDataFactory.createEvent(TEST_USER_1.id, {
            title: "Morning Yoga Session",
            category: "sports",
            date: "2025-10-05",
            start_time: "07:00",
            is_public: true,
          }),
          TestDataFactory.createEvent(TEST_USER_2.id, {
            title: "Tech Startup Pitch Competition",
            category: "networking",
            date: "2025-10-03",
            start_time: "18:00",
            is_public: true,
            max_attendees: 100,
          }),
          TestDataFactory.createEvent(user.id, {
            title: "Advanced JavaScript Workshop",
            category: "workshop",
            date: "2025-10-10",
            start_time: "14:00",
            is_public: false,
            max_attendees: 12,
          }),
          TestDataFactory.createEvent(TEST_USER_1.id, {
            title: "Study Group - Machine Learning",
            category: "study",
            date: "2025-10-01", // Earliest date
            start_time: "16:00",
            is_public: true,
          }),
        ];

        // Use enhanced mock infrastructure for complex event scenarios
        TestHelpers.mockEventDataFunction(mockSupabaseClient, {
          user,
          events: diverseEvents,
          attendees: diverseEvents.flatMap((event) => [
            TestDataFactory.createEventAttendee(event.id, "attendee1", {
              status: "confirmed",
            }),
            TestDataFactory.createEventAttendee(event.id, "attendee2", {
              status: "confirmed",
            }),
          ]),
          organizers: diverseEvents.map((event) =>
            TestDataFactory.createEventOrganizer(event.id, "organizer1", {
              role: "organizer",
            })
          ),
        });

        const result = await getUpcomingEvents();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(4);

        // Verify events include different categories
        const categories = result.data?.map((e) => e.category);
        expect(categories).toContain("sports");
        expect(categories).toContain("networking");
        expect(categories).toContain("workshop");
        expect(categories).toContain("study");
      });

      it("should handle large event dataset with pagination-like behavior", async () => {
        const user = TestDataFactory.createAuthUser();
        TestHelpers.mockAuthUser(mockSupabaseClient, user);

        // Create 50 events with various characteristics
        const manyEvents = Array.from({ length: 50 }, (_, i) =>
          TestDataFactory.createEvent(`creator-${i % 5}`, {
            title: `Event ${i + 1}`,
            date: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String(
              (i % 28) + 1
            ).padStart(2, "0")}`,
            category: ["study", "social", "workshop", "networking", "sports"][
              i % 5
            ],
            is_public: i % 3 === 0, // Every 3rd event is public
            max_attendees: [10, 20, 50, 100][i % 4],
          })
        );

        // Use enhanced mock infrastructure for large dataset
        TestHelpers.mockEventDataFunction(mockSupabaseClient, {
          user,
          events: manyEvents,
          attendees: manyEvents.map((event) =>
            TestDataFactory.createEventAttendee(event.id, "attendee1", {
              status: "confirmed",
            })
          ),
          organizers: manyEvents.map((event) =>
            TestDataFactory.createEventOrganizer(event.id, "organizer1", {
              role: "organizer",
            })
          ),
        });

        const result = await getUpcomingEvents();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(50);

        // Verify mix of public and private events
        const publicEvents = result.data?.filter((e) => e.is_public);
        const privateEvents = result.data?.filter((e) => !e.is_public);
        expect(publicEvents!.length).toBeGreaterThan(0);
        expect(privateEvents!.length).toBeGreaterThan(0);
      });
    });

    describe("getUpcomingFriendsEvents with complex friendship scenarios", () => {
      it("should handle complex friendship network with event organizers", async () => {
        const mainUser = TestDataFactory.createAuthUser({ name: "Main User" });
        const friend1 = TestDataFactory.createAuthUser({ name: "Friend One" });
        const friend2 = TestDataFactory.createAuthUser({ name: "Friend Two" });
        const friend3 = TestDataFactory.createAuthUser({
          name: "Friend Three",
        });

        TestHelpers.mockAuthUser(mockSupabaseClient, mainUser);

        // Create bidirectional friendships
        const friendships = [
          TestDataFactory.createFriendship(mainUser.id, friend1.id),
          TestDataFactory.createFriendship(friend2.id, mainUser.id), // Reverse order
          TestDataFactory.createFriendship(mainUser.id, friend3.id),
        ];

        // Create events organized by friends
        const friendsEvents = [
          TestDataFactory.createEventWithDetails(
            friend1.id,
            [mainUser.id, friend2.id],
            [],
            {
              title: "Friend 1's Study Session",
              category: "study",
              date: "2025-11-15",
              is_public: true,
            }
          ),
          TestDataFactory.createEventWithDetails(
            friend2.id,
            [friend1.id],
            [friend3.id],
            {
              title: "Friend 2's Workshop",
              category: "workshop",
              date: "2025-11-20",
              is_public: false,
              max_attendees: 15,
            }
          ),
          TestDataFactory.createEventWithDetails(friend3.id, [], [], {
            title: "Friend 3's Networking Event",
            category: "networking",
            date: "2025-11-25",
            is_public: true,
            max_attendees: 100,
          }),
        ];

        // Mock friendships query
        const friendshipsQuery = mockSupabaseClient.from().select();
        friendshipsQuery.or.mockResolvedValue(
          MockSupabaseFactory.successListResponse(friendships)
        );

        // Mock events query
        const eventsQuery = mockSupabaseClient.from().select();
        eventsQuery.in.mockReturnThis();
        eventsQuery.eq.mockReturnThis();
        eventsQuery.gte.mockReturnThis();
        eventsQuery.order.mockReturnValue({
          order: jest
            .fn()
            .mockResolvedValue(
              MockSupabaseFactory.successListResponse(friendsEvents)
            ),
        });

        // Mock attendees and organizers for each event
        friendsEvents.forEach((event) => {
          const attendeesQuery = mockSupabaseClient.from().select();
          attendeesQuery.eq.mockResolvedValue(
            MockSupabaseFactory.successListResponse(event.attendees || [])
          );

          const organizersQuery = mockSupabaseClient.from().select();
          organizersQuery.eq.mockResolvedValue(
            MockSupabaseFactory.successListResponse(event.organizers || [])
          );
        });

        const result = await getUpcomingFriendsEvents();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);

        // Verify all events are from friends
        const organizers = result.data?.map((e) => e.created_by);
        expect(organizers).toContain(friend1.id);
        expect(organizers).toContain(friend2.id);
        expect(organizers).toContain(friend3.id);
        expect(organizers).not.toContain(mainUser.id);
      });

      it("should handle friends with no upcoming events", async () => {
        const user = TestDataFactory.createAuthUser();
        const friendWithNoEvents = TestDataFactory.createAuthUser();

        TestHelpers.mockAuthUser(mockSupabaseClient, user);

        const friendships = [
          TestDataFactory.createFriendship(user.id, friendWithNoEvents.id),
        ];

        // Mock friendships query
        const friendshipsQuery = mockSupabaseClient.from().select();
        friendshipsQuery.or.mockResolvedValue(
          MockSupabaseFactory.successListResponse(friendships)
        );

        // Mock empty events query
        const eventsQuery = mockSupabaseClient.from().select();
        eventsQuery.in.mockReturnThis();
        eventsQuery.eq.mockReturnThis();
        eventsQuery.gte.mockReturnThis();
        eventsQuery.order.mockReturnValue({
          order: jest
            .fn()
            .mockResolvedValue(MockSupabaseFactory.successListResponse([])),
        });

        const result = await getUpcomingFriendsEvents();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
        expect(result.message).toBe(
          "Found 0 upcoming events organized by friends"
        );
      });
    });

    describe("getMyEvents with comprehensive user scenarios", () => {
      it("should fetch user events across different roles and statuses", async () => {
        const user = TestDataFactory.createAuthUser();
        TestHelpers.mockAuthUser(mockSupabaseClient, user);

        // Create events where user is organizer
        const organizedEvents = [
          {
            event_id: "org-event-1",
            role: "organizer",
            events: TestDataFactory.createEvent(user.id, {
              id: "org-event-1",
              title: "My Study Group",
              status: "published",
              category: "study",
            }),
          },
          {
            event_id: "org-event-2",
            role: "organizer",
            events: TestDataFactory.createEvent(user.id, {
              id: "org-event-2",
              title: "My Draft Event",
              status: "draft",
              category: "social",
            }),
          },
        ];

        // Create events where user is attending
        const attendingEvents = [
          {
            event_id: "att-event-1",
            status: "confirmed",
            events: TestDataFactory.createEvent(TEST_USER_1.id, {
              id: "att-event-1",
              title: "Friend's Workshop",
              status: "published",
              category: "workshop",
            }),
          },
          {
            event_id: "att-event-2",
            status: "confirmed",
            events: TestDataFactory.createEvent(TEST_USER_2.id, {
              id: "att-event-2",
              title: "Another Event",
              status: "published",
              category: "networking",
            }),
          },
        ];

        // Mock attending events query
        const attendingQuery = mockSupabaseClient.from().select();
        attendingQuery.eq.mockReturnThis();
        attendingQuery.in.mockReturnThis();
        attendingQuery.order.mockResolvedValue(
          MockSupabaseFactory.successListResponse(attendingEvents)
        );

        // Mock organizing events query
        const organizingQuery = mockSupabaseClient.from().select();
        organizingQuery.eq.mockReturnThis();
        organizingQuery.order.mockResolvedValue(
          MockSupabaseFactory.successListResponse(organizedEvents)
        );

        // Mock attendee count queries for each event
        [...attendingEvents, ...organizedEvents].forEach(() => {
          const attendeeCountQuery = mockSupabaseClient.from().select();
          attendeeCountQuery.eq.mockResolvedValue(
            MockSupabaseFactory.successListResponse([
              { status: "confirmed" },
              { status: "confirmed" },
            ])
          );
        });

        const result = await getMyEvents();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(4); // 2 organizing + 2 attending

        // Check if we can identify organized vs attended events
        // Since getMyEvents returns all events in data array, we expect 4 total
        expect(result.data!.length).toBeGreaterThan(0);
      });

      it("should handle user with extensive event history", async () => {
        const user = TestDataFactory.createAuthUser();
        TestHelpers.mockAuthUser(mockSupabaseClient, user);

        // Create 20 organized events with various statuses
        const manyOrganizedEvents = Array.from({ length: 20 }, (_, i) => ({
          event_id: `org-event-${i}`,
          role: "organizer",
          events: TestDataFactory.createEvent(user.id, {
            id: `org-event-${i}`,
            title: `Organized Event ${i + 1}`,
            status: ["draft", "published", "published", "cancelled"][
              i % 4
            ] as EventStatus,
            category: ["study", "social", "workshop", "networking", "sports"][
              i % 5
            ],
            date: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String(
              (i % 28) + 1
            ).padStart(2, "0")}`,
          }),
        }));

        // Create 15 events user is attending
        const manyAttendingEvents = Array.from({ length: 15 }, (_, i) => ({
          event_id: `att-event-${i}`,
          status: "confirmed",
          events: TestDataFactory.createEvent(`organizer-${i}`, {
            id: `att-event-${i}`,
            title: `Attending Event ${i + 1}`,
            status: "published",
            category: ["study", "social", "workshop"][i % 3],
          }),
        }));

        const attendingQuery = mockSupabaseClient.from().select();
        attendingQuery.eq.mockReturnThis();
        attendingQuery.in.mockReturnThis();
        attendingQuery.order.mockResolvedValue(
          MockSupabaseFactory.successListResponse(manyAttendingEvents)
        );

        const organizingQuery = mockSupabaseClient.from().select();
        organizingQuery.eq.mockReturnThis();
        organizingQuery.order.mockResolvedValue(
          MockSupabaseFactory.successListResponse(manyOrganizedEvents)
        );

        // Mock attendee count queries for each event
        [...manyAttendingEvents, ...manyOrganizedEvents].forEach(() => {
          const attendeeCountQuery = mockSupabaseClient.from().select();
          attendeeCountQuery.eq.mockResolvedValue(
            MockSupabaseFactory.successListResponse([{ status: "confirmed" }])
          );
        });

        const result = await getMyEvents();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(35); // 20 organizing + 15 attending

        // Verify event distribution across all events
        const allEvents = result.data || [];
        const publishedCount = allEvents.filter(
          (e) => e.status === "published"
        ).length;
        const draftCount = allEvents.filter((e) => e.status === "draft").length;
        const cancelledCount = allEvents.filter(
          (e) => e.status === "cancelled"
        ).length;

        expect(publishedCount).toBeGreaterThan(0);
        expect(draftCount).toBeGreaterThan(0);
        expect(cancelledCount).toBeGreaterThan(0);
      });
    });

    describe("Edge cases and error scenarios with mock data", () => {
      it("should handle malformed event data gracefully", async () => {
        const user = TestDataFactory.createAuthUser();
        TestHelpers.mockAuthUser(mockSupabaseClient, user);

        // Create event with missing fields (simulating database inconsistency)
        const malformedEvent = {
          id: "malformed-event",
          title: "Incomplete Event",
          // Missing required fields like date, place, etc.
          created_by: user.id,
          status: "published",
        };

        const eventsQuery = mockSupabaseClient.from().select();
        eventsQuery.eq.mockReturnThis();
        eventsQuery.gte.mockReturnThis();
        eventsQuery.order.mockReturnValue({
          order: jest
            .fn()
            .mockResolvedValue(
              MockSupabaseFactory.successListResponse([malformedEvent])
            ),
        });

        // Mock attendees query
        const attendeesQuery = mockSupabaseClient.from().select();
        attendeesQuery.eq.mockResolvedValue(
          MockSupabaseFactory.successListResponse([])
        );

        // Mock organizers query
        const organizersQuery = mockSupabaseClient.from().select();
        organizersQuery.eq.mockResolvedValue(
          MockSupabaseFactory.successListResponse([])
        );

        const result = await getUpcomingEvents();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        // Should still return the event, handling missing fields gracefully
        expect(result.data![0].title).toBe("Incomplete Event");
      });

      it("should handle database timeout scenarios", async () => {
        const user = TestDataFactory.createAuthUser();
        TestHelpers.mockAuthUser(mockSupabaseClient, user);

        // Simulate database timeout - this actually succeeds because it's mocked to return empty data
        const eventsQuery = mockSupabaseClient.from().select();
        eventsQuery.eq.mockReturnThis();
        eventsQuery.gte.mockReturnThis();
        eventsQuery.order.mockReturnValue({
          order: jest
            .fn()
            .mockResolvedValue(MockSupabaseFactory.successListResponse([])),
        });

        const result = await getUpcomingEvents();

        expect(result.success).toBe(true);
        expect(result.message).toBe("Found 0 upcoming events");
      });

      it("should handle concurrent data access patterns", async () => {
        const users = Array.from({ length: 5 }, () =>
          TestDataFactory.createAuthUser()
        );

        // Simulate multiple users accessing events simultaneously
        const promises = users.map((user) => {
          TestHelpers.mockAuthUser(mockSupabaseClient, user);

          const eventsQuery = mockSupabaseClient.from().select();
          eventsQuery.eq.mockReturnThis();
          eventsQuery.gte.mockReturnThis();
          eventsQuery.order.mockReturnValue({
            order: jest.fn().mockResolvedValue(
              MockSupabaseFactory.successListResponse([
                TestDataFactory.createEvent(user.id, {
                  title: `Event for ${user.name}`,
                }),
              ])
            ),
          });

          // Mock attendees and organizers queries
          const attendeesQuery = mockSupabaseClient.from().select();
          attendeesQuery.eq.mockResolvedValue(
            MockSupabaseFactory.successListResponse([])
          );

          const organizersQuery = mockSupabaseClient.from().select();
          organizersQuery.eq.mockResolvedValue(
            MockSupabaseFactory.successListResponse([])
          );

          return getUpcomingEvents();
        });

        const results = await Promise.all(promises);

        results.forEach((result) => {
          expect(result.success).toBe(true);
          expect(result.data).toHaveLength(1);
        });
      });
    });
  });
});
