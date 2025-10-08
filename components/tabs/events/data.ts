"use server";

import { createClient } from "@/lib/supabase/server";
import { EventWithDetails } from "@/lib/types/database";

// Helper function to group array by key
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

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

    // Get upcoming events organized by friends OR created by the user themselves
    // We need to include user's own events with is_public: false
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(
        `
        *
      `
      )
      .or(
        `created_by.in.(${friendIds.join(
          ","
        )}),and(created_by.eq.${userId},is_public.eq.false)`
      )
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

    if (!events || events.length === 0) {
      return {
        success: true,
        message: "No upcoming events found from friends",
        data: [],
      };
    }

    const eventIds = events.map((e) => e.id);

    // Batch query for ALL attendees with profiles (single query instead of N queries)
    const { data: allAttendees } = await supabase
      .from("event_attendees")
      .select(
        "event_id, user_id, status, profile:profiles!event_attendees_user_id_fkey(profile_id, name, studiengang, university, user_id)"
      )
      .in("event_id", eventIds);

    // Batch query for ALL organizers (single query instead of N queries)
    const { data: allOrganizers } = await supabase
      .from("event_organizers")
      .select("event_id, user_id, role")
      .in("event_id", eventIds);

    // Group data by event_id for fast lookup
    const attendeesByEvent = groupBy(allAttendees || [], "event_id") as Record<
      string,
      Array<{
        event_id: string;
        user_id: string;
        status: string;
        profile?: any;
      }>
    >;
    const organizersByEvent = groupBy(
      allOrganizers || [],
      "event_id"
    ) as Record<
      string,
      Array<{ event_id: string; user_id: string; role: string }>
    >;

    // Convert friendIds array to Set for faster lookups
    const friendIdsSet = new Set(friendIds);

    // Enrich events with attendance data (all in memory, no more DB calls)
    const eventsWithDetails: EventWithDetails[] = events.map((event) => {
      const eventAttendees = attendeesByEvent[event.id] || [];
      const eventOrganizers = organizersByEvent[event.id] || [];

      const confirmedAttendees = eventAttendees.filter(
        (a) => a.status === "confirmed"
      );

      const attendee_count = confirmedAttendees.length;
      const is_attending = eventAttendees.some(
        (a) => a.user_id === userId && a.status === "confirmed"
      );
      const is_organizing = eventOrganizers.some((o) => o.user_id === userId);

      // Debug logging
      console.log(
        "Event:",
        event.title,
        "User:",
        userId,
        "is_attending:",
        is_attending,
        "attendees:",
        eventAttendees.map((a) => ({ user: a.user_id, status: a.status }))
      );

      // Map attendees with friendship info
      const attendees = confirmedAttendees
        .filter((a) => a.profile)
        .map((a) => ({
          ...a,
          profile: {
            ...a.profile,
            isFriend: friendIdsSet.has(a.user_id),
          },
        }));

      return {
        ...event,
        attendee_count,
        is_attending,
        is_organizing,
        attendees,
      };
    });

    // Filter out events that have already passed (including time)
    const now = new Date();
    const upcomingEvents = eventsWithDetails.filter((event) => {
      const eventDateTime = new Date(
        `${event.date}T${event.start_time || "00:00"}`
      );
      return eventDateTime > now;
    });

    return {
      success: true,
      message: `Found ${upcomingEvents.length} upcoming events organized by friends`,
      data: upcomingEvents,
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

    if (!events || events.length === 0) {
      return {
        success: true,
        message: "No upcoming events found",
        data: [],
      };
    }

    const eventIds = events.map((e) => e.id);

    // Batch query for ALL attendees with profiles (single query instead of N queries)
    const { data: allAttendees } = await supabase
      .from("event_attendees")
      .select(
        "event_id, user_id, status, profile:profiles!event_attendees_user_id_fkey(profile_id, name, studiengang, university, user_id)"
      )
      .in("event_id", eventIds);

    // Batch query for ALL organizers (single query instead of N queries)
    const { data: allOrganizers } = await supabase
      .from("event_organizers")
      .select("event_id, user_id, role")
      .in("event_id", eventIds);

    // Get friend IDs
    const { data: friendships } = await supabase
      .from("friendships")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    const friendIds = new Set(
      (friendships || []).map((f) =>
        f.user1_id === userId ? f.user2_id : f.user1_id
      )
    );

    // Group data by event_id for fast lookup
    const attendeesByEvent = groupBy(allAttendees || [], "event_id") as Record<
      string,
      Array<{
        event_id: string;
        user_id: string;
        status: string;
        profile?: any;
      }>
    >;
    const organizersByEvent = groupBy(
      allOrganizers || [],
      "event_id"
    ) as Record<
      string,
      Array<{ event_id: string; user_id: string; role: string }>
    >;

    // Enrich events with attendance data (all in memory, no more DB calls)
    const eventsWithDetails: EventWithDetails[] = events.map((event) => {
      const eventAttendees = attendeesByEvent[event.id] || [];
      const eventOrganizers = organizersByEvent[event.id] || [];

      const confirmedAttendees = eventAttendees.filter(
        (a) => a.status === "confirmed"
      );

      const attendee_count = confirmedAttendees.length;
      const is_attending = eventAttendees.some(
        (a) => a.user_id === userId && a.status === "confirmed"
      );
      const is_organizing = eventOrganizers.some((o) => o.user_id === userId);

      // Debug logging
      console.log(
        "[getUpcomingEvents] Event:",
        event.title,
        "User:",
        userId,
        "is_attending:",
        is_attending,
        "attendees:",
        eventAttendees.map((a) => ({ user: a.user_id, status: a.status }))
      );

      // Map attendees with friendship info
      const attendees = confirmedAttendees
        .filter((a) => a.profile)
        .map((a) => ({
          ...a,
          profile: {
            ...a.profile,
            isFriend: friendIds.has(a.user_id),
          },
        }));

      return {
        ...event,
        attendee_count,
        is_attending,
        is_organizing,
        attendees,
      };
    });

    // Filter out events that have already passed (including time)
    const now = new Date();
    const upcomingEvents = eventsWithDetails.filter((event) => {
      const eventDateTime = new Date(
        `${event.date}T${event.start_time || "00:00"}`
      );
      return eventDateTime > now;
    });

    return {
      success: true,
      message: `Found ${upcomingEvents.length} upcoming events`,
      data: upcomingEvents,
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

    // Get friend IDs
    const { data: friendships } = await supabase
      .from("friendships")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    const friendIds = new Set(
      (friendships || []).map((f) =>
        f.user1_id === userId ? f.user2_id : f.user1_id
      )
    );

    // Get attendee counts and profiles for each event
    const eventsWithDetails = await Promise.all(
      combinedEvents.map(async (event) => {
        const { data: attendees } = await supabase
          .from("event_attendees")
          .select(
            "status, user_id, profile:profiles!event_attendees_user_id_fkey(profile_id, name, studiengang, university, user_id)"
          )
          .eq("event_id", event.id);

        const confirmedAttendees = (attendees || []).filter(
          (a) => a.status === "confirmed"
        );
        const attendee_count = confirmedAttendees.length;

        // Map attendees with friendship info
        const attendeesWithFriendship = confirmedAttendees
          .filter((a) => a.profile)
          .map((a) => ({
            ...a,
            profile: {
              ...a.profile,
              isFriend: friendIds.has(a.user_id),
            },
          }));

        return {
          ...event,
          attendee_count,
          attendees: attendeesWithFriendship,
        } as EventWithDetails;
      })
    );

    // Sort by date
    eventsWithDetails.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.start_time || "00:00"}`);
      const dateB = new Date(`${b.date} ${b.start_time || "00:00"}`);
      return dateA.getTime() - dateB.getTime();
    });

    // Filter out events that have already passed (including time)
    const now = new Date();
    const upcomingEvents = eventsWithDetails.filter((event) => {
      const eventDateTime = new Date(
        `${event.date}T${event.start_time || "00:00"}`
      );
      return eventDateTime > now;
    });

    return {
      success: true,
      message: `Found ${upcomingEvents.length} events you're involved in`,
      data: upcomingEvents,
    };
  } catch (error) {
    console.error("Error in getMyEvents:", error);
    return {
      success: false,
      message: "An unexpected error occurred while fetching your events",
    };
  }
}
