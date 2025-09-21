"use server";

import { createClient } from "@/lib/supabase/server";

export interface CreateProfileData {
  name: string;
  studiengang?: string;
  university?: string;
}

export interface CreateProfileResult {
  success: boolean;
  message: string;
  profile?: {
    profile_id: string;
    name: string;
    studiengang: string | null;
    university: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Creates a profile for the authenticated user if they don't have one yet
 * @param profileData - The profile data to create
 * @returns Promise with success status, message, and created profile data
 */
export async function createProfile(
  profileData: CreateProfileData
): Promise<CreateProfileResult> {
  try {
    // Validate input
    if (!profileData.name || profileData.name.trim().length === 0) {
      return {
        success: false,
        message: "Name is required",
      };
    }

    if (profileData.name.trim().length > 255) {
      return {
        success: false,
        message: "Name must be 255 characters or less",
      };
    }

    if (profileData.studiengang && profileData.studiengang.length > 255) {
      return {
        success: false,
        message: "Studiengang must be 255 characters or less",
      };
    }

    if (profileData.university && profileData.university.length > 255) {
      return {
        success: false,
        message: "University must be 255 characters or less",
      };
    }

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

    // Check if user already has a profile
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("profile_id")
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected if no profile exists
      console.error("Error checking existing profile:", checkError);
      return {
        success: false,
        message: "Failed to check existing profile",
      };
    }

    if (existingProfile) {
      return {
        success: false,
        message: "User already has a profile",
      };
    }

    // Create the profile
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        name: profileData.name.trim(),
        studiengang: profileData.studiengang?.trim() || null,
        university: profileData.university?.trim() || null,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating profile:", insertError);

      // Handle specific database errors
      if (insertError.code === "23505") {
        // Unique constraint violation - user already has a profile
        return {
          success: false,
          message: "User already has a profile",
        };
      }

      return {
        success: false,
        message: "Failed to create profile",
      };
    }

    return {
      success: true,
      message: "Profile created successfully",
      profile: newProfile,
    };
  } catch (error) {
    console.error("Unexpected error creating profile:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}
