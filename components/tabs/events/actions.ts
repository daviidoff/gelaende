"use server";

import { createClient } from "@/lib/supabase/server";
import { EventFormData, EventInsert } from "@/lib/types/database";

export interface CreateEventResult {
  success: boolean;
  message: string;
  eventId?: string;
}

/**
 * Server action to create a new event
 * @param eventData - The event data from the form
 * @returns Promise with success status, message, and optional event ID
 */
export async function createEvent(
  eventData: EventFormData
): Promise<CreateEventResult> {
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

    // Validate required fields
    if (!eventData.title || !eventData.date || !eventData.place) {
      return {
        success: false,
        message: "Title, date, and place are required fields",
      };
    }

    // Validate date is not in the past
    const eventDate = new Date(eventData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    if (eventDate < today) {
      return {
        success: false,
        message: "Event date cannot be in the past",
      };
    }

    // Validate start_time and end_time if provided
    if (eventData.start_time && eventData.end_time) {
      const startTime = new Date(`${eventData.date}T${eventData.start_time}`);
      const endTime = new Date(`${eventData.date}T${eventData.end_time}`);

      if (endTime <= startTime) {
        return {
          success: false,
          message: "End time must be after start time",
        };
      }
    }

    // Validate max_attendees if provided
    if (eventData.max_attendees !== undefined && eventData.max_attendees < 1) {
      return {
        success: false,
        message: "Maximum attendees must be at least 1",
      };
    }

    // Prepare event data for insertion
    const eventInsert: EventInsert = {
      title: eventData.title.trim(),
      description: eventData.description?.trim() || null,
      date: eventData.date,
      start_time: eventData.start_time || null,
      end_time: eventData.end_time || null,
      place: eventData.place.trim(),
      location_details: eventData.location_details?.trim() || null,
      max_attendees: eventData.max_attendees || null,
      category: eventData.category?.trim() || null,
      is_public: eventData.is_public ?? true,
      status: "published", // Default to published
      created_by: userId,
    };

    // Insert the event
    const { data: event, error: insertError } = await supabase
      .from("events")
      .insert(eventInsert)
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating event:", insertError);
      return {
        success: false,
        message: `Failed to create event: ${insertError.message}`,
      };
    }

    // Automatically add the creator as an organizer
    const { error: organizerError } = await supabase
      .from("event_organizers")
      .insert({
        event_id: event.id,
        user_id: userId,
        role: "organizer",
      });

    if (organizerError) {
      console.error("Error adding creator as organizer:", organizerError);
      // Don't fail the whole operation, just log the error
      // The event was created successfully, we can manually fix organizer later
    }

    return {
      success: true,
      message: "Event created successfully!",
      eventId: event.id,
    };
  } catch (error) {
    console.error("Error in createEvent:", error);
    return {
      success: false,
      message: "An unexpected error occurred while creating the event",
    };
  }
}

export interface JoinEventResult {
  success: boolean;
  message: string;
}

/**
 * Server action to join an event as an attendee
 * @param eventId - The ID of the event to join
 * @returns Promise with success status and message
 */
export async function joinEvent(eventId: string): Promise<JoinEventResult> {
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

    // Check if event exists and is published
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, max_attendees, status")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return {
        success: false,
        message: "Event not found",
      };
    }

    if (event.status !== "published") {
      return {
        success: false,
        message: "This event is not available for joining",
      };
    }

    // Check if user is already attending
    const { data: existingAttendance, error: checkError } = await supabase
      .from("event_attendees")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error checking attendance:", checkError);
      return {
        success: false,
        message: "Failed to check attendance status",
      };
    }

    if (existingAttendance) {
      if (existingAttendance.status === "confirmed") {
        return {
          success: false,
          message: "You are already attending this event",
        };
      } else if (existingAttendance.status === "pending") {
        return {
          success: false,
          message: "You already have a pending request for this event",
        };
      }
    }

    // Check if event is at capacity (if max_attendees is set)
    if (event.max_attendees) {
      const { data: attendeeCount, error: countError } = await supabase
        .from("event_attendees")
        .select("id")
        .eq("event_id", eventId)
        .eq("status", "confirmed");

      if (countError) {
        console.error("Error counting attendees:", countError);
        return {
          success: false,
          message: "Failed to check event capacity",
        };
      }

      if (attendeeCount && attendeeCount.length >= event.max_attendees) {
        return {
          success: false,
          message: "This event is at full capacity",
        };
      }
    }

    // Join the event (confirmed by default for public events)
    const { error: joinError } = await supabase.from("event_attendees").insert({
      event_id: eventId,
      user_id: userId,
      status: "confirmed",
    });

    if (joinError) {
      console.error("Error joining event:", joinError);
      return {
        success: false,
        message: `Failed to join event: ${joinError.message}`,
      };
    }

    return {
      success: true,
      message: `Successfully joined "${event.title}"!`,
    };
  } catch (error) {
    console.error("Error in joinEvent:", error);
    return {
      success: false,
      message: "An unexpected error occurred while joining the event",
    };
  }
}

/**
 * Server action to leave an event
 * @param eventId - The ID of the event to leave
 * @returns Promise with success status and message
 */
export async function leaveEvent(eventId: string): Promise<JoinEventResult> {
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

    // Check if user is attending the event
    const { data: attendance, error: checkError } = await supabase
      .from("event_attendees")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (checkError || !attendance) {
      return {
        success: false,
        message: "You are not attending this event",
      };
    }

    // Remove attendance
    const { error: leaveError } = await supabase
      .from("event_attendees")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (leaveError) {
      console.error("Error leaving event:", leaveError);
      return {
        success: false,
        message: `Failed to leave event: ${leaveError.message}`,
      };
    }

    return {
      success: true,
      message: "Successfully left the event",
    };
  } catch (error) {
    console.error("Error in leaveEvent:", error);
    return {
      success: false,
      message: "An unexpected error occurred while leaving the event",
    };
  }
}
