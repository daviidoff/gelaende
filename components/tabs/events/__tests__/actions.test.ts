import { createClient } from "@/lib/supabase/server";
import { createEvent, joinEvent, leaveEvent } from "../actions";

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

  const mockCreatedEvent = {
    id: mockEventId,
    ...mockEventData,
    created_by: mockUserId,
    status: "published",
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
});
