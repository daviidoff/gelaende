"use server";

import { createClient } from "@/lib/supabase/server";

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
