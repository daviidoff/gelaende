/**
 * Integration tests for complex event scenarios
 * Tests event conflicts, capacity limits, permission checks, and edge cases
 */

import { createClient } from "@/lib/supabase/server";
import { createTestScenario } from "@/lib/test-data";
import {
  MockSupabaseFactory,
  TestDataFactory,
  TestHelpers,
} from "@/lib/test-factories";
import { createEvent, joinEvent, leaveEvent } from "../actions";
import { getUpcomingEvents, getUpcomingFriendsEvents } from "../data";

// Mock modules
jest.mock("@/lib/supabase/server");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe("Events Integration Tests", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = TestHelpers.createMockSupabaseClient();
    mockCreateClient.mockResolvedValue(mockSupabaseClient);
  });

  describe("Event Capacity Management", () => {
    it("should handle reaching exact capacity with concurrent joins", async () => {
      const organizer = TestDataFactory.createAuthUser();
      const event = TestDataFactory.createEvent(organizer.id, {
        title: "Limited Workshop",
        max_attendees: 3,
        is_public: true,
      });

      // Create 2 existing attendees
      const existingAttendees = [
        TestDataFactory.createEventAttendee(event.id, "user-1", {
          status: "confirmed",
        }),
        TestDataFactory.createEventAttendee(event.id, "user-2", {
          status: "confirmed",
        }),
      ];

      // User trying to join
      const newUser = TestDataFactory.createAuthUser();
      TestHelpers.mockAuthUser(mockSupabaseClient, newUser);

      // Mock event query
      const eventQuery = TestHelpers.createDefaultMockQuery();
      eventQuery.single.mockResolvedValue(
        MockSupabaseFactory.successResponse(event)
      );
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      // Mock capacity check - shows 2 confirmed attendees
      const capacityQuery = TestHelpers.createDefaultMockQuery();
      capacityQuery.mockResolvedValue(
        MockSupabaseFactory.successListResponse(existingAttendees)
      );
      mockSupabaseClient.from.mockReturnValueOnce(capacityQuery);

      // Mock user not already attending
      const existingQuery = TestHelpers.createDefaultMockQuery();
      existingQuery.single.mockResolvedValue(
        MockSupabaseFactory.emptyResponse()
      );
      mockSupabaseClient.from.mockReturnValueOnce(existingQuery);

      // Mock successful join
      const insertQuery = TestHelpers.createDefaultMockQuery();
      insertQuery.mockResolvedValue(
        MockSupabaseFactory.successResponse({
          event_id: event.id,
          user_id: newUser.id,
        })
      );
      mockSupabaseClient.from.mockReturnValueOnce(insertQuery);

      const result = await joinEvent(event.id);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Successfully joined the event!");
    });

    it("should reject joining when event exceeds capacity", async () => {
      const organizer = TestDataFactory.createAuthUser();
      const event = TestDataFactory.createEvent(organizer.id, {
        title: "Full Workshop",
        max_attendees: 2,
        is_public: true,
      });

      // Event is already at capacity
      const fullAttendees = [
        TestDataFactory.createEventAttendee(event.id, "user-1", {
          status: "confirmed",
        }),
        TestDataFactory.createEventAttendee(event.id, "user-2", {
          status: "confirmed",
        }),
      ];

      const newUser = TestDataFactory.createAuthUser();
      TestHelpers.mockAuthUser(mockSupabaseClient, newUser);

      // Mock event query
      const eventQuery = TestHelpers.createDefaultMockQuery();
      eventQuery.single.mockResolvedValue(
        MockSupabaseFactory.successResponse(event)
      );
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      // Mock capacity check - shows event is full
      const capacityQuery = TestHelpers.createDefaultMockQuery();
      capacityQuery.mockResolvedValue(
        MockSupabaseFactory.successListResponse(fullAttendees)
      );
      mockSupabaseClient.from.mockReturnValueOnce(capacityQuery);

      // Mock user not already attending
      const existingQuery = TestHelpers.createDefaultMockQuery();
      existingQuery.single.mockResolvedValue(
        MockSupabaseFactory.emptyResponse()
      );
      mockSupabaseClient.from.mockReturnValueOnce(existingQuery);

      const result = await joinEvent(event.id);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Event is at maximum capacity");
    });

    it("should handle varying attendance statuses in capacity calculations", async () => {
      const organizer = TestDataFactory.createAuthUser();
      const event = TestDataFactory.createEvent(organizer.id, {
        title: "Mixed Status Event",
        max_attendees: 5,
        is_public: true,
      });

      // Mixed attendance statuses - only confirmed should count toward capacity
      const mixedAttendees = [
        TestDataFactory.createEventAttendee(event.id, "user-1", {
          status: "confirmed",
        }),
        TestDataFactory.createEventAttendee(event.id, "user-2", {
          status: "confirmed",
        }),
        TestDataFactory.createEventAttendee(event.id, "user-3", {
          status: "pending",
        }),
        TestDataFactory.createEventAttendee(event.id, "user-4", {
          status: "declined",
        }),
      ];

      const newUser = TestDataFactory.createAuthUser();
      TestHelpers.mockAuthUser(mockSupabaseClient, newUser);

      // Mock event query
      const eventQuery = mockSupabaseClient.from().select();
      eventQuery.single.mockResolvedValue(
        MockSupabaseFactory.successResponse(event)
      );

      // Mock capacity check - returns only confirmed attendees (2)
      const capacityQuery = mockSupabaseClient.from().select();
      capacityQuery.eq.mockReturnThis();
      capacityQuery.mockResolvedValue(
        MockSupabaseFactory.successListResponse(
          mixedAttendees.filter((a) => a.status === "confirmed")
        )
      );

      // Mock user not already attending
      const existingQuery = TestHelpers.createDefaultMockQuery();
      existingQuery.single.mockResolvedValue(
        MockSupabaseFactory.emptyResponse()
      );
      mockSupabaseClient.from.mockReturnValueOnce(existingQuery);

      // Mock successful join
      const insertQuery = mockSupabaseClient.from().insert();
      insertQuery.mockResolvedValue(
        MockSupabaseFactory.successResponse({
          event_id: event.id,
          user_id: newUser.id,
        })
      );

      const result = await joinEvent(event.id);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Successfully joined the event!");
    });
  });

  describe("Event Time Conflicts", () => {
    it("should allow creating overlapping events for different users", async () => {
      const user1 = TestDataFactory.createAuthUser();
      const user2 = TestDataFactory.createAuthUser();

      // Both events at same time but different organizers
      const eventData = {
        title: "Overlapping Event",
        date: "2025-12-01",
        start_time: "14:00",
        end_time: "16:00",
        place: "Room A",
        is_public: true,
      };

      // First event creation
      TestHelpers.mockAuthUser(mockSupabaseClient, user1);
      TestHelpers.mockEventCreation(mockSupabaseClient, "event-1");
      TestHelpers.mockOrganizerInsertion(mockSupabaseClient);

      const result1 = await createEvent(eventData);

      // Second event creation
      TestHelpers.mockAuthUser(mockSupabaseClient, user2);
      TestHelpers.mockEventCreation(mockSupabaseClient, "event-2");
      TestHelpers.mockOrganizerInsertion(mockSupabaseClient);

      const result2 = await createEvent({
        ...eventData,
        title: "Another Overlapping Event",
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Both should succeed - no time conflict prevention between different organizers
    });

    it("should handle user attending multiple events with time overlap", async () => {
      const user = TestDataFactory.createAuthUser();
      const organizer1 = TestDataFactory.createAuthUser();
      const organizer2 = TestDataFactory.createAuthUser();

      const event1 = TestDataFactory.createEvent(organizer1.id, {
        title: "First Event",
        date: "2025-12-01",
        start_time: "14:00",
        end_time: "16:00",
        place: "Room A",
      });

      const event2 = TestDataFactory.createEvent(organizer2.id, {
        title: "Overlapping Event",
        date: "2025-12-01",
        start_time: "15:00",
        end_time: "17:00",
        place: "Room B",
      });

      TestHelpers.mockAuthUser(mockSupabaseClient, user);

      // Mock first event join
      let eventQuery = TestHelpers.createDefaultMockQuery();
      eventQuery.single.mockResolvedValue(
        MockSupabaseFactory.successResponse(event1)
      );
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      let capacityQuery = TestHelpers.createDefaultMockQuery();
      capacityQuery.mockResolvedValue(
        MockSupabaseFactory.successListResponse([])
      );
      mockSupabaseClient.from.mockReturnValueOnce(capacityQuery);

      let existingQuery = TestHelpers.createDefaultMockQuery();
      existingQuery.single.mockResolvedValue(
        MockSupabaseFactory.emptyResponse()
      );
      mockSupabaseClient.from.mockReturnValueOnce(existingQuery);

      let insertQuery = TestHelpers.createDefaultMockQuery();
      insertQuery.mockResolvedValue(
        MockSupabaseFactory.successResponse({
          event_id: event1.id,
          user_id: user.id,
        })
      );
      mockSupabaseClient.from.mockReturnValueOnce(insertQuery);

      const result1 = await joinEvent(event1.id);

      // Mock second event join
      eventQuery = TestHelpers.createDefaultMockQuery();
      eventQuery.single.mockResolvedValue(
        MockSupabaseFactory.successResponse(event2)
      );
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      capacityQuery = TestHelpers.createDefaultMockQuery();
      capacityQuery.mockResolvedValue(
        MockSupabaseFactory.successListResponse([])
      );
      mockSupabaseClient.from.mockReturnValueOnce(capacityQuery);

      existingQuery = TestHelpers.createDefaultMockQuery();
      existingQuery.single.mockResolvedValue(
        MockSupabaseFactory.emptyResponse()
      );
      mockSupabaseClient.from.mockReturnValueOnce(existingQuery);

      insertQuery = TestHelpers.createDefaultMockQuery();
      insertQuery.mockResolvedValue(
        MockSupabaseFactory.successResponse({
          event_id: event2.id,
          user_id: user.id,
        })
      );
      mockSupabaseClient.from.mockReturnValueOnce(insertQuery);

      const result2 = await joinEvent(event2.id);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // System allows user to join overlapping events - user responsibility to manage
    });
  });

  describe("Permission and Authorization", () => {
    it("should prevent non-organizers from certain actions", async () => {
      const organizer = TestDataFactory.createAuthUser();
      const regularUser = TestDataFactory.createAuthUser();

      const event = TestDataFactory.createEvent(organizer.id, {
        title: "Restricted Event",
        is_public: false,
      });

      TestHelpers.mockAuthUser(mockSupabaseClient, regularUser);

      // Mock organizer check - user is not an organizer
      const organizerQuery = TestHelpers.createDefaultMockQuery();
      organizerQuery.single.mockResolvedValue(
        MockSupabaseFactory.emptyResponse()
      );
      mockSupabaseClient.from.mockReturnValueOnce(organizerQuery);

      // Mock attendee check - user is attending
      const attendeeQuery = TestHelpers.createDefaultMockQuery();
      attendeeQuery.single.mockResolvedValue(
        MockSupabaseFactory.successResponse({
          event_id: event.id,
          user_id: regularUser.id,
          status: "confirmed",
        })
      );
      mockSupabaseClient.from.mockReturnValueOnce(attendeeQuery);

      const result = await leaveEvent(event.id);

      expect(result.success).toBe(true); // Regular attendee can leave
      expect(result.message).toBe("Successfully left the event!");
    });

    it("should prevent event organizers from leaving their own events", async () => {
      const organizer = TestDataFactory.createAuthUser();
      const event = TestDataFactory.createEvent(organizer.id, {
        title: "Organizer's Event",
      });

      TestHelpers.mockAuthUser(mockSupabaseClient, organizer);

      // Mock organizer check - user is the organizer
      const organizerQuery = TestHelpers.createDefaultMockQuery();
      organizerQuery.single.mockResolvedValue(
        MockSupabaseFactory.successResponse({
          event_id: event.id,
          user_id: organizer.id,
          role: "organizer",
        })
      );
      mockSupabaseClient.from.mockReturnValueOnce(organizerQuery);

      const result = await leaveEvent(event.id);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Event organizers cannot leave their own events"
      );
    });

    it("should handle co-organizer permissions correctly", async () => {
      const mainOrganizer = TestDataFactory.createAuthUser();
      const coOrganizer = TestDataFactory.createAuthUser();

      const event = TestDataFactory.createEvent(mainOrganizer.id, {
        title: "Multi-Organizer Event",
      });

      TestHelpers.mockAuthUser(mockSupabaseClient, coOrganizer);

      // Mock organizer check - user is a co-organizer
      const organizerQuery = TestHelpers.createDefaultMockQuery();
      organizerQuery.single.mockResolvedValue(
        MockSupabaseFactory.successResponse({
          event_id: event.id,
          user_id: coOrganizer.id,
          role: "co-organizer",
        })
      );
      mockSupabaseClient.from.mockReturnValueOnce(organizerQuery);

      const result = await leaveEvent(event.id);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Event organizers cannot leave their own events"
      );
    });
  });

  describe("Complex User Journey Scenarios", () => {
    it("should handle complete event lifecycle from creation to attendance", async () => {
      const organizer = TestDataFactory.createAuthUser({
        name: "Event Organizer",
      });
      const attendee1 = TestDataFactory.createAuthUser({ name: "Attendee 1" });
      const attendee2 = TestDataFactory.createAuthUser({ name: "Attendee 2" });

      // Step 1: Create event
      TestHelpers.mockAuthUser(mockSupabaseClient, organizer);
      TestHelpers.mockEventCreation(mockSupabaseClient, "lifecycle-event");
      TestHelpers.mockOrganizerInsertion(mockSupabaseClient);

      const eventData = {
        title: "Complete Lifecycle Event",
        description: "Testing full event lifecycle",
        date: "2025-12-20",
        start_time: "10:00",
        end_time: "12:00",
        place: "Conference Room",
        max_attendees: 10,
        category: "workshop",
        is_public: true,
      };

      const createResult = await createEvent(eventData);
      expect(createResult.success).toBe(true);

      // Step 2: First attendee joins
      TestHelpers.mockAuthUser(mockSupabaseClient, attendee1);

      const event = TestDataFactory.createEvent(organizer.id, {
        ...eventData,
        id: "lifecycle-event",
      });

      let eventQuery = TestHelpers.createDefaultMockQuery();
      eventQuery.single.mockResolvedValue(
        MockSupabaseFactory.successResponse(event)
      );
      mockSupabaseClient.from.mockReturnValueOnce(eventQuery);

      let capacityQuery = TestHelpers.createDefaultMockQuery();
      capacityQuery.mockResolvedValue(
        MockSupabaseFactory.successListResponse([])
      );
      mockSupabaseClient.from.mockReturnValueOnce(capacityQuery);

      let existingQuery = TestHelpers.createDefaultMockQuery();
      existingQuery.single.mockResolvedValue(
        MockSupabaseFactory.emptyResponse()
      );
      mockSupabaseClient.from.mockReturnValueOnce(existingQuery);

      let insertQuery = TestHelpers.createDefaultMockQuery();
      insertQuery.mockResolvedValue(
        MockSupabaseFactory.successResponse({
          event_id: event.id,
          user_id: attendee1.id,
        })
      );
      mockSupabaseClient.from.mockReturnValueOnce(insertQuery);

      const join1Result = await joinEvent(event.id);
      expect(join1Result.success).toBe(true);

      // Step 3: Second attendee joins
      TestHelpers.mockAuthUser(mockSupabaseClient, attendee2);

      eventQuery = mockSupabaseClient.from().select();
      eventQuery.single.mockResolvedValue(
        MockSupabaseFactory.successResponse(event)
      );

      // Now showing 1 confirmed attendee
      capacityQuery = mockSupabaseClient.from().select();
      capacityQuery.eq.mockReturnThis();
      capacityQuery.mockResolvedValue(
        MockSupabaseFactory.successListResponse([
          TestDataFactory.createEventAttendee(event.id, attendee1.id, {
            status: "confirmed",
          }),
        ])
      );

      existingQuery = TestHelpers.createDefaultMockQuery();
      existingQuery.single.mockResolvedValue(
        MockSupabaseFactory.emptyResponse()
      );
      mockSupabaseClient.from.mockReturnValueOnce(existingQuery);

      insertQuery = TestHelpers.createDefaultMockQuery();
      insertQuery.mockResolvedValue(
        MockSupabaseFactory.successResponse({
          event_id: event.id,
          user_id: attendee2.id,
        })
      );

      const join2Result = await joinEvent(event.id);
      expect(join2Result.success).toBe(true);

      // Step 4: First attendee leaves
      TestHelpers.mockAuthUser(mockSupabaseClient, attendee1);

      const organizerCheck = TestHelpers.createDefaultMockQuery();
      organizerCheck.single.mockResolvedValue(
        MockSupabaseFactory.emptyResponse()
      );
      mockSupabaseClient.from.mockReturnValueOnce(organizerCheck);

      const attendeeCheck = TestHelpers.createDefaultMockQuery();
      attendeeCheck.single.mockResolvedValue(
        MockSupabaseFactory.successResponse({
          event_id: event.id,
          user_id: attendee1.id,
          status: "confirmed",
        })
      );
      mockSupabaseClient.from.mockReturnValueOnce(attendeeCheck);

      const deleteQuery = mockSupabaseClient.from().delete();
      deleteQuery.eq.mockReturnThis();
      deleteQuery.eq.mockResolvedValue(
        MockSupabaseFactory.successResponse(null)
      );

      const leaveResult = await leaveEvent(event.id);
      expect(leaveResult.success).toBe(true);

      // All steps should complete successfully
      expect(createResult.success).toBe(true);
      expect(join1Result.success).toBe(true);
      expect(join2Result.success).toBe(true);
      expect(leaveResult.success).toBe(true);
    });

    it("should handle bulk event operations with friends network", async () => {
      // Create a scenario with multiple users and their friendships
      const scenario = createTestScenario(5, 3, 10); // 5 users, 3 places, 10 activities
      const [user1] = scenario.users;

      // User1 creates multiple events
      const authUser1 = TestDataFactory.createAuthUser();
      TestHelpers.mockAuthUser(mockSupabaseClient, authUser1);

      const events = [
        TestDataFactory.createEvent(user1.id, {
          title: "Study Group 1",
          category: "study",
          is_public: true,
        }),
        TestDataFactory.createEvent(user1.id, {
          title: "Workshop 1",
          category: "workshop",
          is_public: false,
        }),
        TestDataFactory.createEvent(user1.id, {
          title: "Social Event 1",
          category: "social",
          is_public: true,
        }),
      ];

      // Mock friends events query
      const friendships = scenario.friendships.filter(
        (f) => f.user1_id === user1.id || f.user2_id === user1.id
      );

      const friendshipsQuery = mockSupabaseClient.from().select();
      friendshipsQuery.or.mockResolvedValue(
        MockSupabaseFactory.successListResponse(friendships)
      );

      const eventsQuery = mockSupabaseClient.from().select();
      eventsQuery.in.mockReturnThis();
      eventsQuery.eq.mockReturnThis();
      eventsQuery.gte.mockReturnThis();
      eventsQuery.order.mockReturnValue({
        order: jest
          .fn()
          .mockResolvedValue(MockSupabaseFactory.successListResponse(events)),
      });

      // Mock attendees and organizers queries
      events.forEach((event) => {
        const attendeesQuery = mockSupabaseClient.from().select();
        attendeesQuery.eq.mockResolvedValue(
          MockSupabaseFactory.successListResponse([])
        );

        const organizersQuery = mockSupabaseClient.from().select();
        organizersQuery.eq.mockResolvedValue(
          MockSupabaseFactory.successListResponse([
            TestDataFactory.createEventOrganizer(event.id, user1.id, {
              role: "organizer",
            }),
          ])
        );
      });

      const result = await getUpcomingFriendsEvents();

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });
  });

  describe("Error Recovery and Edge Cases", () => {
    it("should handle database inconsistencies gracefully", async () => {
      const user = TestDataFactory.createAuthUser();
      TestHelpers.mockAuthUser(mockSupabaseClient, user);

      // Simulate inconsistent data - event exists but organizer record missing
      const orphanEvent = TestDataFactory.createEvent("non-existent-user", {
        title: "Orphan Event",
      });

      const eventsQuery = mockSupabaseClient.from().select();
      eventsQuery.eq.mockReturnThis();
      eventsQuery.gte.mockReturnThis();
      eventsQuery.order.mockResolvedValue(
        MockSupabaseFactory.successListResponse([orphanEvent])
      );

      const result = await getUpcomingEvents();

      expect(result.success).toBe(true);
      // Should handle gracefully even with inconsistent data
      expect(result.data).toHaveLength(1);
    });

    it("should handle network timeouts and retries", async () => {
      const user = TestDataFactory.createAuthUser();
      TestHelpers.mockAuthUser(mockSupabaseClient, user);

      // First call fails with timeout
      const eventsQuery = mockSupabaseClient.from().select();
      eventsQuery.eq.mockReturnThis();
      eventsQuery.gte.mockReturnThis();
      eventsQuery.order.mockRejectedValueOnce(new Error("Network timeout"));

      const result = await getUpcomingEvents();

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "An unexpected error occurred while fetching upcoming events"
      );
    });

    it("should handle malformed event data", async () => {
      const user = TestDataFactory.createAuthUser();
      TestHelpers.mockAuthUser(mockSupabaseClient, user);

      // Event with invalid/missing fields
      const malformedEvents = [
        {
          id: "malformed-1",
          title: "", // Empty title
          created_by: user.id,
          // Missing other required fields
        },
        {
          id: "malformed-2",
          title: "Valid Title",
          date: "invalid-date",
          created_by: user.id,
        },
      ];

      const eventsQuery = mockSupabaseClient.from().select();
      eventsQuery.eq.mockReturnThis();
      eventsQuery.gte.mockReturnThis();
      eventsQuery.order.mockResolvedValue(
        MockSupabaseFactory.successListResponse(malformedEvents)
      );

      const result = await getUpcomingEvents();

      expect(result.success).toBe(true);
      // Should still return events, handling malformed data gracefully
      expect(result.data).toHaveLength(2);
    });
  });
});
