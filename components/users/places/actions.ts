"use server";

import { createClient } from "@/lib/supabase/server";
import { ActivityInsert } from "@/lib/types/database";
import { revalidatePath } from "next/cache";

export interface SetPlaceResult {
  success: boolean;
  activity_id?: string;
  error?: string;
}

/**
 * Server action to set a user's current place by creating an activity record
 * @param placeId - The ID of the place where the user is currently located
 * @returns Promise with success status and activity ID or error message
 */
export async function setPlace(placeId: string): Promise<SetPlaceResult> {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Authentication required. Please log in to set your place.",
      };
    }

    // Validate that the place exists
    const { data: place, error: placeError } = await supabase
      .from("places")
      .select("place_id")
      .eq("place_id", placeId)
      .single();

    if (placeError || !place) {
      return {
        success: false,
        error: "Place not found. Please ensure the place exists.",
      };
    }

    // Create the activity record with current timestamp
    const activityData: ActivityInsert = {
      user_id: user.id,
      place_id: placeId,
      time: new Date().toISOString(),
    };

    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .insert(activityData)
      .select("activity_id")
      .single();

    if (activityError) {
      console.error("Error creating activity:", activityError);
      return {
        success: false,
        error: "Failed to set place. Please try again.",
      };
    }

    // Revalidate relevant paths to update UI
    revalidatePath("/protected");
    revalidatePath("/activities");

    return {
      success: true,
      activity_id: activity.activity_id,
    };
  } catch (error) {
    console.error("Unexpected error in setPlace:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Server action to get the user's most recent place/activity
 * @param userId - Optional user ID to get another user's current place (defaults to current user)
 * @returns Promise with the most recent activity or null if none found
 */
export async function getCurrentPlace(userId?: string) {
  try {
    const supabase = await createClient();

    // If no userId provided, get current user
    let targetUserId = userId;
    if (!targetUserId) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: "Authentication required.",
        };
      }
      targetUserId = user.id;
    }

    // Get the most recent activity for the user
    const { data: activity, error } = await supabase
      .from("activities")
      .select(
        `
        activity_id,
        time,
        places (
          place_id,
          name,
          location
        )
      `
      )
      .eq("user_id", targetUserId)
      .order("time", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no activities found, return null (not an error)
      if (error.code === "PGRST116") {
        return {
          success: true,
          activity: null,
        };
      }
      return {
        success: false,
        error: "Failed to fetch current place.",
      };
    }

    return {
      success: true,
      activity,
    };
  } catch (error) {
    console.error("Unexpected error in getCurrentPlace:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

/**
 * Server action to get all places a user has been to
 * @param userId - Optional user ID (defaults to current user)
 * @returns Promise with list of unique places the user has visited
 */
export async function getUserPlaces(userId?: string) {
  try {
    const supabase = await createClient();

    // If no userId provided, get current user
    let targetUserId = userId;
    if (!targetUserId) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: "Authentication required.",
        };
      }
      targetUserId = user.id;
    }

    // Get all unique places the user has been to with their latest visit
    const { data: activities, error } = await supabase
      .from("activities")
      .select(
        `
        time,
        places (
          place_id,
          name,
          location
        )
      `
      )
      .eq("user_id", targetUserId)
      .order("time", { ascending: false });

    if (error) {
      return {
        success: false,
        error: "Failed to fetch user places.",
      };
    }

    // Group by place_id and keep the most recent activity for each place
    const uniquePlaces =
      activities?.reduce((acc, activity) => {
        const place = Array.isArray(activity.places)
          ? activity.places[0]
          : activity.places;
        if (
          place &&
          !acc.some((p) => {
            const existingPlace = Array.isArray(p.places)
              ? p.places[0]
              : p.places;
            return existingPlace?.place_id === place.place_id;
          })
        ) {
          acc.push(activity);
        }
        return acc;
      }, [] as typeof activities) || [];

    return {
      success: true,
      places: uniquePlaces,
    };
  } catch (error) {
    console.error("Unexpected error in getUserPlaces:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}
