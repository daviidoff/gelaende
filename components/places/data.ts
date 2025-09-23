"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type Place = Database["public"]["Tables"]["places"]["Row"];

export interface GetPlacesResult {
  success: boolean;
  message: string;
  places?: Place[];
}

export interface GetPlacesPaginatedResult {
  success: boolean;
  message: string;
  places?: Place[];
  totalCount?: number;
  hasMore?: boolean;
}

export interface GetPlacesParams {
  searchTerm?: string;
  page?: number;
  limit?: number;
}

/**
 * Retrieves places from the database with optional search
 * @param searchTerm Optional search term to filter places by name
 * @returns Promise with success status, message, and places array
 */
export async function getPlaces(searchTerm?: string): Promise<GetPlacesResult> {
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

    // Build query with optional search
    let query = supabase.from("places").select("*");

    if (searchTerm && searchTerm.trim()) {
      query = query.ilike("name", `%${searchTerm.trim()}%`);
    }

    const { data: places, error: placesError } = await query.order("name");

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

/**
 * Retrieves places from the database with optional search and pagination
 * @param params Object containing searchTerm, page, and limit
 * @returns Promise with success status, message, places array, and pagination info
 */
export async function getPlacesPaginated(params: GetPlacesParams = {}): Promise<GetPlacesPaginatedResult> {
  try {
    const { searchTerm, page = 1, limit = 10 } = params;
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

    // Build query with optional search
    let query = supabase.from("places").select("*", { count: "exact" });

    if (searchTerm && searchTerm.trim()) {
      query = query.ilike("name", `%${searchTerm.trim()}%`);
    }

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: places, error: placesError, count } = await query
      .order("name")
      .range(from, to);

    if (placesError) {
      console.error("Error fetching places:", placesError);
      return {
        success: false,
        message: "Failed to fetch places",
      };
    }

    const totalCount = count || 0;
    const hasMore = totalCount > page * limit;

    return {
      success: true,
      message: "Places retrieved successfully",
      places: places || [],
      totalCount,
      hasMore,
    };
  } catch (error) {
    console.error("Unexpected error in getPlaces:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}
