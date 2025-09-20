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
