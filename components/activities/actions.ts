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

export interface UpdateActivityPictureResult {
  success: boolean;
  message: string;
  activity?: Activity;
}

export interface UpdateActivityPictureParams {
  activityId: string;
  pictureData: string;
}

/**
 * Updates an existing activity with a picture
 * @param params - Activity ID and picture data (base64)
 * @returns Promise with success status, message, and updated activity data
 */
export async function updateActivityPicture(
  params: UpdateActivityPictureParams
): Promise<UpdateActivityPictureResult> {
  try {
    const { activityId, pictureData } = params;

    // Validate required fields
    if (!activityId || activityId.trim().length === 0) {
      return {
        success: false,
        message: "Activity ID is required",
      };
    }

    if (!pictureData || pictureData.trim().length === 0) {
      return {
        success: false,
        message: "Picture data is required",
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

    // Update the activity with picture data
    const { data, error } = await supabase
      .from("activities")
      .update({ picture: pictureData })
      .eq("activity_id", activityId.trim())
      .eq("user_id", user.id) // Ensure user owns the activity
      .select("*")
      .single();

    if (error) {
      console.error("Error updating activity picture:", error);

      // Handle specific error cases
      if (error.code === "PGRST116") {
        // No rows returned (activity not found or not owned by user)
        return {
          success: false,
          message:
            "Activity not found or you don't have permission to update it",
        };
      }

      return {
        success: false,
        message: "Failed to update activity picture",
      };
    }

    return {
      success: true,
      message: "Picture added successfully",
      activity: data,
    };
  } catch (error) {
    console.error("Unexpected error in updateActivityPicture:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

export interface GetUserLastActivityResult {
  success: boolean;
  message: string;
  activity?: Activity;
}

/**
 * Gets the user's most recent activity
 * @returns Promise with success status, message, and activity data
 */
export async function getUserLastActivity(): Promise<GetUserLastActivityResult> {
  try {
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

    // Get the user's most recent activity
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", user.id)
      .order("time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching last activity:", error);
      return {
        success: false,
        message: "Failed to fetch recent activity",
      };
    }

    if (!data) {
      return {
        success: false,
        message: "No recent activities found",
      };
    }

    return {
      success: true,
      message: "Last activity retrieved successfully",
      activity: data,
    };
  } catch (error) {
    console.error("Unexpected error in getUserLastActivity:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}
