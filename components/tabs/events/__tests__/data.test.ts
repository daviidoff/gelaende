import { createClient } from "@/lib/supabase/server";
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
      expect((result.data![0] as any).organizer_role).toBe("co-organizer");
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
});
