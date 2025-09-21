"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type Place = Database["public"]["Tables"]["places"]["Row"];
type PlaceInsert = Database["public"]["Tables"]["places"]["Insert"];
type PlaceUpdate = Database["public"]["Tables"]["places"]["Update"];

export interface SetPlaceResult {
  success: boolean;
  message: string;
  place?: Place;
}

export interface SetPlaceParams {
  name: string;
  location?: { lat: number; lng: number } | null;
  place_id?: string; // If provided, update existing place; otherwise create new
}

/**
 * Creates a new place or updates an existing place in the database
 * @param params - Place data including name, location, and optional place_id for updates
 * @returns Promise with success status, message, and place data
 */
export async function setPlace(
  params: SetPlaceParams
): Promise<SetPlaceResult> {
  try {
    const { name, location, place_id } = params;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        message: "Place name is required",
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

    let result;
    let operation;

    if (place_id) {
      // Update existing place
      operation = "update";
      const updateData: PlaceUpdate = {
        name: name.trim(),
        location: location || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("places")
        .update(updateData)
        .eq("place_id", place_id)
        .select("*")
        .single();

      result = { data, error };
    } else {
      // Create new place
      operation = "create";
      const insertData: PlaceInsert = {
        name: name.trim(),
        location: location || null,
      };

      const { data, error } = await supabase
        .from("places")
        .insert(insertData)
        .select("*")
        .single();

      result = { data, error };
    }

    if (result.error) {
      console.error(
        `Error ${operation === "create" ? "creating" : "updating"} place:`,
        result.error
      );

      // Handle specific error cases
      if (result.error.code === "23505") {
        // Unique constraint violation
        return {
          success: false,
          message: "A place with this name already exists",
        };
      }

      if (result.error.code === "23503") {
        // Foreign key constraint violation
        return {
          success: false,
          message: "Invalid place reference",
        };
      }

      return {
        success: false,
        message: `Failed to ${operation} place`,
      };
    }

    return {
      success: true,
      message: `Place ${operation}d successfully`,
      place: result.data,
    };
  } catch (error) {
    console.error("Unexpected error in setPlace:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}
