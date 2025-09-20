"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type Place = Database["public"]["Tables"]["places"]["Row"];

export interface GetPlacesResult {
  success: boolean;
  message: string;
  places?: Place[];
}

/**
 * Retrieves all places from the database
 * @returns Promise with success status, message, and places array
 */
export async function getPlaces(): Promise<GetPlacesResult> {
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

    // Fetch all places from the database
    const { data: places, error: placesError } = await supabase
      .from("places")
      .select("*")
      .order("name");

    if (placesError) {
      console.error("Error fetching places:", placesError);
      return {
        success: false,
        message: "Failed to fetch places",
      };
    }

    return {
      success: true,
      message: "Places retrieved successfully",
      places: places || [],
    };
  } catch (error) {
    console.error("Unexpected error in getPlaces:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}
