import { createClient } from "@/lib/supabase/server";
import {
  MockSupabaseFactory,
  TEST_USER_1,
  TestDataFactory,
  TestHelpers,
} from "@/lib/test-factories";
import {
  attendEvent,
  createEvent,
  joinEvent,
  leaveEvent,
  unattendEvent,
} from "../actions";

// Mock modules
jest.mock("@/lib/supabase/server");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe("Events Actions Functions", () => {
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
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      })),
    };

    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  // Test data
  const mockUserId = "user-123";
  const mockEventId = "event-456";

  const mockUser = {
    id: mockUserId,
    email: "test@example.com",
  };

  const mockEventData = {
    title: "Test Event",
    description: "A test event description",
    date: "2025-12-25", // Future date
    start_time: "14:00",
    end_time: "18:00",
    place: "Test Location",
    location_details: "Near the main entrance",
    max_attendees: 50,
    category: "social",
    is_public: true,
  };

  describe("createEvent", () => {
    it("should create an event successfully", async () => {
      // Mock auth response
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock event insertion
      const insertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: mockEventId },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(insertQuery);

      // Mock organizer insertion
      const organizerQuery = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(organizerQuery);

      const result = await createEvent(mockEventData);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Event created successfully!");
      expect(result.eventId).toBe(mockEventId);

      // Verify event data was properly formatted
      expect(insertQuery.insert).toHaveBeenCalledWith({
        title: "Test Event",
        description: "A test event description",
        date: "2025-12-25",
        start_time: "14:00",
        end_time: "18:00",
        place: "Test Location",
        location_details: "Near the main entrance",
        max_attendees: 50,
        category: "social",
        is_public: true,
        status: "published",
        created_by: mockUserId,
      });

      // Verify organizer was added
      expect(organizerQuery.insert).toHaveBeenCalledWith({
        event_id: mockEventId,
        user_id: mockUserId,
        role: "organizer",
      });
    });

    it("should handle authentication error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await createEvent(mockEventData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Authentication required");
      expect(result.eventId).toBeUndefined();
    });

    it("should validate required fields", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const incompleteEventData = {
        title: "",
        date: "2025-12-25",
        place: "Test Location",
      };

      const result = await createEvent(incompleteEventData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Title, date, and place are required fields");
    });

    it("should validate date is not in the past", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const pastEventData = {
        ...mockEventData,
        date: "2020-01-01", // Past date
      };

      const result = await createEvent(pastEventData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Event date cannot be in the past");
    });

    it("should validate start and end time", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const invalidTimeEventData = {
        ...mockEventData,
        start_time: "18:00",
        end_time: "14:00", // End before start
      };

      const result = await createEvent(invalidTimeEventData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("End time must be after start time");
    });

    it("should validate max_attendees", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const invalidCapacityEventData = {
        ...mockEventData,
        max_attendees: 0, // Invalid capacity
      };

      const result = await createEvent(invalidCapacityEventData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Maximum attendees must be at least 1");
    });

    it("should handle database insertion error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const insertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(insertQuery);

      const result = await createEvent(mockEventData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to create event: Database error");
    });

    it("should handle organizer insertion error gracefully", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock successful event insertion
      const insertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: mockEventId },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(insertQuery);

      // Mock failed organizer insertion
      const organizerQuery = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Organizer insertion failed" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(organizerQuery);

      const result = await createEvent(mockEventData);

      // Should still succeed as event was created
      expect(result.success).toBe(true);
      expect(result.message).toBe("Event created successfully!");
      expect(result.eventId).toBe(mockEventId);
    });

    it("should handle unexpected errors", async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Network error")
      );

      const result = await createEvent(mockEventData);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "An unexpected error occurred while creating the event"
      );
    });

    it("should trim whitespace from string fields", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const insertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: mockEventId },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(insertQuery);

      const organizerQuery = {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(organizerQuery);

      const eventDataWithWhitespace = {
        ...mockEventData,
        title: "  Test Event  ",
        description: "  A test description  ",
        place: "  Test Location  ",
        location_details: "  Near entrance  ",
        category: "  social  ",
      };

      await createEvent(eventDataWithWhitespace);

      expect(insertQuery.insert).toHaveBeenCalledWith({
        title: "Test Event",
        description: "A test description",
        date: "2025-12-25",
        start_time: "14:00",
        end_time: "18:00",
        place: "Test Location",
        location_details: "Near entrance",
        max_attendees: 50,
        category: "social",
        is_public: true,
        status: "published",
        created_by: mockUserId,
      });
    });
  });

  describe("joinEvent", () => {
    const mockEvent = {
      id: mockEventId,
      title: "Test Event",
      max_attendees: 10,
      status: "published",
    };

    it("should join an event successfully", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock event lookup
      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      // Mock attendance check (no existing attendance)
      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" }, // No rows returned
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      // Mock capacity check
      const capacityQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: "att1" }, { id: "att2" }], // 2 existing attendees
            error: null,
          }),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(capacityQuery);

      // Mock join insertion
      const joinQuery = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(joinQuery);

      const result = await joinEvent(mockEventId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully joined "Test Event"!');

      expect(joinQuery.insert).toHaveBeenCalledWith({
        event_id: mockEventId,
        user_id: mockUserId,
        status: "confirmed",
      });
    });

    it("should handle authentication error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await joinEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Authentication required");
    });

    it("should handle event not found", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Event not found" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const result = await joinEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Event not found");
    });

    it("should handle event not published", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const draftEvent = { ...mockEvent, status: "draft" };
      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: draftEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const result = await joinEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("This event is not available for joining");
    });

    it("should handle already attending", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "att1", status: "confirmed" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      const result = await joinEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("You are already attending this event");
    });

    it("should handle pending attendance", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "att1", status: "pending" },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      const result = await joinEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "You already have a pending request for this event"
      );
    });

    it("should handle event at capacity", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockEvent, max_attendees: 2 },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      const capacityQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: "att1" }, { id: "att2" }], // 2 attendees, capacity is 2
            error: null,
          }),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(capacityQuery);

      const result = await joinEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("This event is at full capacity");
    });
  });

  describe("attendEvent", () => {
    const mockEvent = {
      id: mockEventId,
      title: "Test Event",
      max_attendees: 10,
      status: "published",
    };

    it("should mark attendance for an event successfully", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock event lookup
      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      // Mock attendance check (no existing attendance)
      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" }, // No rows returned
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      // Mock capacity check
      const capacityQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: "att1" }, { id: "att2" }], // 2 existing attendees
            error: null,
          }),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(capacityQuery);

      // Mock attendance insertion
      const attendQuery = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendQuery);

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Successfully marked attendance for "Test Event"!'
      );

      expect(attendQuery.insert).toHaveBeenCalledWith({
        event_id: mockEventId,
        user_id: mockUserId,
        status: "confirmed",
      });
    });

    it("should handle authentication error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Authentication required");
    });

    it("should handle event not found", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Event not found" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Event not found");
    });

    it("should allow attending draft events (unlike joinEvent)", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const draftEvent = { ...mockEvent, status: "draft" };
      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: draftEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      const attendQuery = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendQuery);

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Successfully marked attendance for "Test Event"!'
      );
    });

    it("should allow attending completed events", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const completedEvent = { ...mockEvent, status: "completed" };
      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: completedEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      const attendQuery = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendQuery);

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Successfully marked attendance for "Test Event"!'
      );
    });

    it("should handle already confirmed attendance", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: "att1", status: "confirmed" },
              error: null,
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "You are already marked as attending this event"
      );
    });

    it("should confirm pending attendance", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: "att1", status: "pending" },
              error: null,
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(updateQuery);

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Attendance confirmed for "Test Event"!');

      expect(updateQuery.update).toHaveBeenCalledWith({ status: "confirmed" });
    });

    it("should handle event at capacity for published events", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockEvent, max_attendees: 2 },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      const capacityQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: "att1" }, { id: "att2" }], // 2 attendees, capacity is 2
            error: null,
          }),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(capacityQuery);

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("This event is at full capacity");
    });

    it("should ignore capacity check for non-published events", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const draftEvent = { ...mockEvent, status: "draft", max_attendees: 1 };
      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: draftEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      const attendQuery = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendQuery);

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Successfully marked attendance for "Test Event"!'
      );
    });

    it("should ignore capacity check when max_attendees is null", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockEvent, max_attendees: null },
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      const attendQuery = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendQuery);

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Successfully marked attendance for "Test Event"!'
      );
    });

    it("should handle attendance insertion error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      const capacityQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: "att1" }], // 1 attendee
            error: null,
          }),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(capacityQuery);

      const attendQuery = {
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendQuery);

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to mark attendance: Database error");
    });

    it("should handle update error for pending attendance", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: "att1", status: "pending" },
              error: null,
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceCheckQuery);

      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Update failed" },
          }),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(updateQuery);

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to update attendance: Update failed");
    });

    it("should handle unexpected errors", async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Network error")
      );

      const result = await attendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "An unexpected error occurred while marking attendance"
      );
    });
  });

  describe("leaveEvent", () => {
    it("should leave an event successfully", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock attendance check
      const attendanceQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: "attendance-123" },
              error: null,
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceQuery);

      // Mock deletion
      const deleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(deleteQuery);

      const result = await leaveEvent(mockEventId);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Successfully left the event");
    });

    it("should handle authentication error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await leaveEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Authentication required");
    });

    it("should handle not attending event", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const attendanceQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "No attendance found" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceQuery);

      const result = await leaveEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("You are not attending this event");
    });

    it("should handle deletion error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const attendanceQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: "attendance-123" },
              error: null,
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceQuery);

      const deleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Deletion failed" },
          }),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(deleteQuery);

      const result = await leaveEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to leave event: Deletion failed");
    });

    it("should handle unexpected errors", async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Network error")
      );

      const result = await leaveEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "An unexpected error occurred while leaving the event"
      );
    });
  });

  // Comprehensive mock data test scenarios
  describe("Comprehensive Mock Data Tests", () => {
    describe("createEvent with realistic scenarios", () => {
      it("should create a study event with full details", async () => {
        const creator = TestDataFactory.createAuthUser({
          name: "Max Mustermann",
          email: "max.mustermann@tum.de",
        });

        TestHelpers.mockAuthUser(mockSupabaseClient, creator);
        TestHelpers.mockEventCreation(mockSupabaseClient, "study-event-123");
        TestHelpers.mockOrganizerInsertion(mockSupabaseClient);

        const studyEventData = {
          title: "Advanced Algorithms Study Group",
          description:
            "Weekly study session for the Advanced Algorithms course. We'll cover dynamic programming, graph algorithms, and complexity analysis.",
          date: "2025-12-15",
          start_time: "14:00",
          end_time: "17:00",
          place: "TU München Library - Room 3.14",
          location_details:
            "Third floor, Computer Science section. Look for the 'Algorithms Study' sign.",
          max_attendees: 15,
          category: "study",
          is_public: true,
        };

        const result = await createEvent(studyEventData);

        expect(result.success).toBe(true);
        expect(result.message).toBe("Event created successfully!");
        expect(result.eventId).toBe("study-event-123");
      });

      it("should create a networking event with location constraints", async () => {
        const creator = TestDataFactory.createAuthUser({
          name: "Dr. Sarah Tech",
          email: "sarah.tech@lmu.de",
        });

        TestHelpers.mockAuthUser(mockSupabaseClient, creator);
        TestHelpers.mockEventCreation(mockSupabaseClient, "networking-456");
        TestHelpers.mockOrganizerInsertion(mockSupabaseClient);

        const networkingEventData = {
          title: "Munich Tech Professionals Meetup",
          description:
            "Monthly networking event for tech professionals in Munich. Great opportunity to meet like-minded people and discuss current trends.",
          date: "2025-11-20",
          start_time: "18:30",
          end_time: "21:00",
          place: "WeWork Maxvorstadt",
          location_details:
            "5th floor event space. Registration required at reception.",
          max_attendees: 50,
          category: "networking",
          is_public: true,
        };

        const result = await createEvent(networkingEventData);

        expect(result.success).toBe(true);
        expect(result.eventId).toBe("networking-456");
      });

      it("should handle capacity-limited workshop event", async () => {
        const creator = TestDataFactory.createAuthUser();
        TestHelpers.mockAuthUser(mockSupabaseClient, creator);
        TestHelpers.mockEventCreation(mockSupabaseClient, "workshop-789");
        TestHelpers.mockOrganizerInsertion(mockSupabaseClient);

        const workshopData = {
          title: "Hands-on React Workshop",
          description:
            "Limited seats! Intensive 3-hour workshop covering React hooks, state management, and testing.",
          date: "2025-10-30",
          start_time: "09:00",
          end_time: "12:00",
          place: "Startup Incubator Munich",
          location_details: "Workshop room A, 2nd floor. Laptops required.",
          max_attendees: 8, // Very limited capacity
          category: "workshop",
          is_public: false, // Private workshop
        };

        const result = await createEvent(workshopData);

        expect(result.success).toBe(true);
        expect(result.eventId).toBe("workshop-789");
      });
    });

    describe("joinEvent with complex scenarios", () => {
      it("should handle joining a popular event near capacity", async () => {
        const user = TestDataFactory.createAuthUser();
        const event = TestDataFactory.createEvent(TEST_USER_1.id, {
          max_attendees: 20,
          title: "Popular Tech Talk",
          status: "published",
        });

        // Create 18 existing attendees (near capacity)
        const existingAttendees = Array.from({ length: 18 }, (_, i) =>
          TestDataFactory.createEventAttendee(event.id, `user-${i}`, {
            status: "confirmed",
          })
        );

        TestHelpers.mockAuthUser(mockSupabaseClient, user);

        // Mock event query
        const eventQuery = TestHelpers.createDefaultMockQuery();
        eventQuery.single.mockResolvedValue(
          MockSupabaseFactory.successResponse(event)
        );
        mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

        // Mock attendee count query
        const countQuery = TestHelpers.createDefaultMockQuery();
        countQuery.mockResolvedValue(
          MockSupabaseFactory.successListResponse(existingAttendees)
        );
        mockSupabaseClient.from.mockReturnValueOnce(countQuery);

        // Mock existing attendance check
        const existingQuery = TestHelpers.createDefaultMockQuery();
        existingQuery.single.mockResolvedValue(
          MockSupabaseFactory.emptyResponse()
        );
        mockSupabaseClient.from.mockReturnValueOnce(existingQuery);

        // Mock successful insertion
        const insertQuery = TestHelpers.createDefaultMockQuery();
        insertQuery.mockResolvedValue(
          MockSupabaseFactory.successResponse({
            event_id: event.id,
            user_id: user.id,
          })
        );
        mockSupabaseClient.from.mockReturnValueOnce(insertQuery);

        const result = await joinEvent(event.id);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Successfully joined "Popular Tech Talk"!');
      });

      it("should reject joining when event is at capacity", async () => {
        const user = TestDataFactory.createAuthUser();
        const event = TestDataFactory.createEvent(TEST_USER_1.id, {
          max_attendees: 5,
          title: "Small Workshop",
          status: "published",
        });

        // Create exactly 5 confirmed attendees (at capacity)
        const maxAttendees = Array.from({ length: 5 }, (_, i) =>
          TestDataFactory.createEventAttendee(event.id, `user-${i}`, {
            status: "confirmed",
          })
        );

        TestHelpers.mockAuthUser(mockSupabaseClient, user);

        // Mock event query (first)
        const eventQuery = TestHelpers.createDefaultMockQuery();
        eventQuery.single.mockResolvedValue(
          MockSupabaseFactory.successResponse(event)
        );
        mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

        // Mock existing attendance check (second) - no existing attendance
        const existingQuery = TestHelpers.createDefaultMockQuery();
        existingQuery.single.mockResolvedValue(
          MockSupabaseFactory.emptyResponse()
        );
        mockSupabaseClient.from.mockReturnValueOnce(existingQuery);

        // Mock attendee count query showing full capacity (third)
        const countQuery = TestHelpers.createDefaultMockQuery();
        countQuery.mockResolvedValue(
          MockSupabaseFactory.successListResponse(maxAttendees)
        );
        mockSupabaseClient.from.mockReturnValueOnce(countQuery);

        const result = await joinEvent(event.id);

        expect(result.success).toBe(false);
        expect(result.message).toBe("This event is at full capacity");
      });
    });

    describe("Event attendance edge cases", () => {
      it("should handle multiple rapid join requests", async () => {
        const users = Array.from({ length: 3 }, () =>
          TestDataFactory.createAuthUser()
        );
        const event = TestDataFactory.createEvent(TEST_USER_1.id, {
          max_attendees: 10,
          title: "Concurrent Join Test Event",
        });

        // Simulate concurrent join attempts
        const joinPromises = users.map((user) => {
          TestHelpers.mockAuthUser(mockSupabaseClient, user);

          // Mock event exists
          const eventQuery = TestHelpers.createDefaultMockQuery();
          eventQuery.single.mockResolvedValue(
            MockSupabaseFactory.successResponse(event)
          );
          mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

          // Mock capacity check (event not full)
          const countQuery = TestHelpers.createDefaultMockQuery();
          countQuery.mockResolvedValue(
            MockSupabaseFactory.successListResponse([]) // Empty initially
          );
          mockSupabaseClient.from.mockReturnValueOnce(countQuery);

          // Mock not already attending
          const existingQuery = TestHelpers.createDefaultMockQuery();
          existingQuery.single.mockResolvedValue(
            MockSupabaseFactory.emptyResponse()
          );
          mockSupabaseClient.from.mockReturnValueOnce(existingQuery);

          // Mock successful insertion
          const insertQuery = TestHelpers.createDefaultMockQuery();
          insertQuery.mockResolvedValue(
            MockSupabaseFactory.successResponse({
              event_id: event.id,
              user_id: user.id,
            })
          );
          mockSupabaseClient.from.mockReturnValueOnce(insertQuery);

          return joinEvent(event.id);
        });

        const results = await Promise.all(joinPromises);

        // All should succeed in this test scenario
        results.forEach((result) => {
          expect(result.success).toBe(true);
        });
      });

      it("should handle leaving event with multiple organizers", async () => {
        const mainOrganizer = TestDataFactory.createAuthUser();
        const coOrganizer = TestDataFactory.createAuthUser();
        const event = TestDataFactory.createEvent(mainOrganizer.id, {
          title: "Multi-Organizer Event",
        });

        // Create organizer relationships
        const organizers = [
          TestDataFactory.createEventOrganizer(event.id, mainOrganizer.id, {
            role: "organizer",
          }),
          TestDataFactory.createEventOrganizer(event.id, coOrganizer.id, {
            role: "co-organizer",
          }),
        ];

        TestHelpers.mockAuthUser(mockSupabaseClient, coOrganizer);

        // Mock organizer check
        const organizerQuery = TestHelpers.createDefaultMockQuery();
        organizerQuery.single.mockResolvedValue(
          MockSupabaseFactory.successResponse(organizers[1])
        );
        mockSupabaseClient.from.mockReturnValueOnce(organizerQuery);

        const result = await leaveEvent(event.id);

        expect(result.success).toBe(false);
        expect(result.message).toBe(
          "Event organizers cannot leave their own events"
        );
      });
    });

    describe("Event data validation with realistic data", () => {
      it("should validate comprehensive event data scenarios", async () => {
        const creator = TestDataFactory.createAuthUser();
        TestHelpers.mockAuthUser(mockSupabaseClient, creator);

        // Test various invalid scenarios
        const invalidScenarios = [
          {
            name: "Empty title",
            data: { title: "", date: "2025-12-01", place: "Test Location" },
            expectedMessage: "Title, date, and place are required fields",
          },
          {
            name: "Weekend past date",
            data: {
              title: "Test Event",
              date: "2024-01-01",
              place: "Test Location",
            },
            expectedMessage: "Event date cannot be in the past",
          },
          {
            name: "Invalid time range",
            data: {
              title: "Test Event",
              date: "2025-12-01",
              place: "Test Location",
              start_time: "20:00",
              end_time: "08:00",
            },
            expectedMessage: "End time must be after start time",
          },
          {
            name: "Negative capacity",
            data: {
              title: "Test Event",
              date: "2025-12-01",
              place: "Test Location",
              max_attendees: -5,
            },
            expectedMessage: "Maximum attendees must be at least 1",
          },
        ];

        for (const scenario of invalidScenarios) {
          const result = await createEvent(scenario.data);
          expect(result.success).toBe(false);
          expect(result.message).toBe(scenario.expectedMessage);
        }
      });
    });
  });

  describe("unattendEvent", () => {
    const mockEvent = {
      id: mockEventId,
      title: "Test Event",
      status: "published",
    };

    it("should unattend an event successfully", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock event lookup
      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      // Mock attendance check
      const attendanceQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: "attendance-123", status: "confirmed" },
              error: null,
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceQuery);

      // Mock deletion
      const deleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(deleteQuery);

      const result = await unattendEvent(mockEventId);

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        `Successfully removed attendance for "${mockEvent.title}"`
      );
    });

    it("should handle authentication error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await unattendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Authentication required");
    });

    it("should handle event not found", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Event not found" },
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const result = await unattendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Event not found");
    });

    it("should handle not attending event", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: "No attendance found" },
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceQuery);

      const result = await unattendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("You are not attending this event");
    });

    it("should handle pending attendance status", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: "attendance-123", status: "pending" },
              error: null,
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceQuery);

      const result = await unattendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "You can only unattend events you have confirmed attendance for"
      );
    });

    it("should handle deletion error", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const eventQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockEvent,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      const attendanceQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: "attendance-123", status: "confirmed" },
              error: null,
            }),
          })),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(attendanceQuery);

      const deleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Deletion failed" },
          }),
        })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(deleteQuery);

      const result = await unattendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to unattend event: Deletion failed");
    });

    it("should handle unexpected errors", async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error("Network error")
      );

      const result = await unattendEvent(mockEventId);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "An unexpected error occurred while unattending the event"
      );
    });
  });
});
