"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type Activity = Database["public"]["Tables"]["activities"]["Row"];
type ActivityInsert = Database["public"]["Tables"]["activities"]["Insert"];

export interface AddActivityResult {
  success: boolean;
  message: string;
  activity?: Activity;
}

export interface AddActivityParams {
  place_id: string;
}

/**
 * Creates a new activity for the current user at a specific place
 * @param params - Activity data including place_id
 * @returns Promise with success status, message, and activity data
 */
export async function addActivity(
  params: AddActivityParams
): Promise<AddActivityResult> {
  try {
    const { place_id } = params;

    // Validate required fields
    if (!place_id || place_id.trim().length === 0) {
      return {
        success: false,
        message: "Place ID is required",
      };
    }

    const supabase = await createClient();

    // Get the current user to ensure authentication
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

    console.log(
      "add activity time:",
      new Date(),
      "\niso:",
      new Date().toISOString()
    );
    // Create new activity with current time
    const insertData: ActivityInsert = {
      user_id: user.id,
      place_id: place_id.trim(),
      time: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("activities")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      console.error("Error creating activity:", error);

      // Handle specific error cases
      if (error.code === "23503") {
        // Foreign key constraint violation
        return {
          success: false,
          message: "Invalid place reference",
        };
      }

      return {
        success: false,
        message: "Failed to create activity",
      };
    }

    return {
      success: true,
      message: "Activity created successfully",
      activity: data,
    };
  } catch (error) {
    console.error("Unexpected error in addActivity:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}
