"use server";

import { createClient } from "@/lib/supabase/server";
import { EventWithDetails } from "@/lib/types/database";

export interface GetUpcomingFriendsEventsResult {
  success: boolean;
  message: string;
  data?: EventWithDetails[];
}

/**
 * Server function to get upcoming events organized by friends of the current user
 * @returns Promise with success status, message, and array of upcoming events organized by friends
 */
export async function getUpcomingFriendsEvents(): Promise<GetUpcomingFriendsEventsResult> {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    const userId = user.id;

    // First, get all friend user IDs
    const { data: friendships, error: friendshipsError } = await supabase
      .from("friendships")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (friendshipsError) {
      return {
        success: false,
        message: `Error fetching friendships: ${friendshipsError.message}`,
      };
    }

    // Extract friend user IDs (exclude current user)
    const friendIds =
      friendships?.map((friendship) =>
        friendship.user1_id === userId
          ? friendship.user2_id
          : friendship.user1_id
      ) || [];

    if (friendIds.length === 0) {
      return {
        success: true,
        message: "No friends found",
        data: [],
      };
    }

    const today = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format

    // Get upcoming events organized by friends
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(
        `
        *
      `
      )
      .in("created_by", friendIds)
      .eq("status", "published")
      .gte("date", today)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (eventsError) {
      return {
        success: false,
        message: `Error fetching events: ${eventsError.message}`,
      };
    }

    // For each event, get attendee and organizer counts and check if current user is attending/organizing
    const eventsWithDetails = await Promise.all(
      (events || []).map(async (event) => {
        // Get attendee count and check if current user is attending
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data: attendees, error: _attendeesError } = await supabase
          .from("event_attendees")
          .select("user_id, status")
          .eq("event_id", event.id);

        // Get organizers and check if current user is organizing
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data: organizers, error: _organizersError } = await supabase
          .from("event_organizers")
          .select("user_id, role")
          .eq("event_id", event.id);

        const attendee_count =
          attendees?.filter((a) => a.status === "confirmed").length || 0;
        const is_attending =
          attendees?.some(
            (a) => a.user_id === userId && a.status === "confirmed"
          ) || false;
        const is_organizing =
          organizers?.some((o) => o.user_id === userId) || false;

        return {
          ...event,
          attendee_count,
          is_attending,
          is_organizing,
        } as EventWithDetails;
      })
    );

    return {
      success: true,
      message: `Found ${eventsWithDetails.length} upcoming events organized by friends`,
      data: eventsWithDetails,
    };
  } catch (error) {
    console.error("Error in getUpcomingFriendsEvents:", error);
    return {
      success: false,
      message:
        "An unexpected error occurred while fetching upcoming friends' events",
    };
  }
}

/**
 * Server function to get all upcoming events (published events in the future)
 * @returns Promise with success status, message, and array of upcoming events
 */
export async function getUpcomingEvents(): Promise<GetUpcomingFriendsEventsResult> {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    const userId = user.id;
    const today = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format

    // Get all upcoming published events
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(
        `
        *
      `
      )
      .eq("status", "published")
      .eq("is_public", true)
      .gte("date", today)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (eventsError) {
      return {
        success: false,
        message: `Error fetching events: ${eventsError.message}`,
      };
    }

    // For each event, get attendee and organizer counts and check if current user is attending/organizing
    const eventsWithDetails = await Promise.all(
      (events || []).map(async (event) => {
        // Get attendee count and check if current user is attending
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data: attendees, error: _attendeesError } = await supabase
          .from("event_attendees")
          .select("user_id, status")
          .eq("event_id", event.id);

        // Get organizers and check if current user is organizing
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data: organizers, error: _organizersError } = await supabase
          .from("event_organizers")
          .select("user_id, role")
          .eq("event_id", event.id);

        const attendee_count =
          attendees?.filter((a) => a.status === "confirmed").length || 0;
        const is_attending =
          attendees?.some(
            (a) => a.user_id === userId && a.status === "confirmed"
          ) || false;
        const is_organizing =
          organizers?.some((o) => o.user_id === userId) || false;

        return {
          ...event,
          attendee_count,
          is_attending,
          is_organizing,
        } as EventWithDetails;
      })
    );

    return {
      success: true,
      message: `Found ${eventsWithDetails.length} upcoming events`,
      data: eventsWithDetails,
    };
  } catch (error) {
    console.error("Error in getUpcomingEvents:", error);
    return {
      success: false,
      message: "An unexpected error occurred while fetching upcoming events",
    };
  }
}

/**
 * Server function to get events the current user is attending
 * @returns Promise with success status, message, and array of events user is attending
 */
export async function getMyEvents(): Promise<GetUpcomingFriendsEventsResult> {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    const userId = user.id;

    // Get events user is attending or organizing
    const { data: attendingEvents, error: attendingError } = await supabase
      .from("event_attendees")
      .select(
        `
        event_id,
        status,
        events!inner(
          *,
          creator_profile:profiles!events_created_by_fkey(
            profile_id,
            name,
            studiengang,
            university,
            user_id
          )
        )
      `
      )
      .eq("user_id", userId)
      .in("status", ["confirmed", "pending"])
      .order("events(date)", { ascending: true });

    const { data: organizingEvents, error: organizingError } = await supabase
      .from("event_organizers")
      .select(
        `
        event_id,
        role,
        events!inner(
          *,
          creator_profile:profiles!events_created_by_fkey(
            profile_id,
            name,
            studiengang,
            university,
            user_id
          )
        )
      `
      )
      .eq("user_id", userId)
      .order("events(date)", { ascending: true });

    if (attendingError || organizingError) {
      return {
        success: false,
        message: `Error fetching user events: ${
          attendingError?.message || organizingError?.message
        }`,
      };
    }

    // Combine and deduplicate events
    const allEventIds = new Set();
    // Using any[] due to complex nested query structure from Supabase relations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const combinedEvents: any[] = [];

    // Add attending events
    attendingEvents?.forEach((item) => {
      if (!allEventIds.has(item.event_id)) {
        allEventIds.add(item.event_id);
        combinedEvents.push({
          ...item.events,
          is_attending: true,
          is_organizing: false,
          attendance_status: item.status,
        });
      }
    });

    // Add organizing events (and update if already exists)
    organizingEvents?.forEach((item) => {
      const existingIndex = combinedEvents.findIndex(
        (e) => e.id === item.event_id
      );
      if (existingIndex >= 0) {
        combinedEvents[existingIndex].is_organizing = true;
        combinedEvents[existingIndex].organizer_role = item.role;
      } else {
        allEventIds.add(item.event_id);
        combinedEvents.push({
          ...item.events,
          is_attending: false,
          is_organizing: true,
          organizer_role: item.role,
        });
      }
    });

    // Get attendee counts for each event
    const eventsWithDetails = await Promise.all(
      combinedEvents.map(async (event) => {
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select("status")
          .eq("event_id", event.id);

        const attendee_count =
          attendees?.filter((a) => a.status === "confirmed").length || 0;

        return {
          ...event,
          attendee_count,
        } as EventWithDetails;
      })
    );

    // Sort by date
    eventsWithDetails.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.start_time || "00:00"}`);
      const dateB = new Date(`${b.date} ${b.start_time || "00:00"}`);
      return dateA.getTime() - dateB.getTime();
    });

    return {
      success: true,
      message: `Found ${eventsWithDetails.length} events you're involved in`,
      data: eventsWithDetails,
    };
  } catch (error) {
    console.error("Error in getMyEvents:", error);
    return {
      success: false,
      message: "An unexpected error occurred while fetching your events",
    };
  }
}
