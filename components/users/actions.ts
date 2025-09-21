"use server";

import { createClient } from "@/lib/supabase/server";

export interface SearchUsersResult {
  success: boolean;
  message: string;
  users?: {
    profile_id: string;
    name: string;
    studiengang: string | null;
    university: string | null;
    user_id: string;
  }[];
}

/**
 * Searches for users by name, excluding current user and existing friends
 * @param searchTerm - The name to search for
 * @returns Promise with success status, message, and array of user profiles
 */
export async function searchUsers(
  searchTerm: string
): Promise<SearchUsersResult> {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return {
        success: true,
        message: "Search term must be at least 2 characters",
        users: [],
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

    // Get all existing friends and pending invites
    const [friendshipsResult, invitesResult] = await Promise.all([
      supabase
        .from("friendships")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      supabase
        .from("friendship_invites")
        .select("requester_id, requestee_id")
        .or(`requester_id.eq.${userId},requestee_id.eq.${userId}`),
    ]);

    // Check for errors in either query
    if (friendshipsResult.error || invitesResult.error) {
      console.error(
        "Error fetching user data:",
        friendshipsResult.error || invitesResult.error
      );
      return {
        success: false,
        message: "Error searching users",
      };
    }

    const excludedUserIds = new Set([userId]); // Start with current user

    // Add existing friends
    if (friendshipsResult.data) {
      friendshipsResult.data.forEach((friendship) => {
        const friendId =
          friendship.user1_id === userId
            ? friendship.user2_id
            : friendship.user1_id;
        excludedUserIds.add(friendId);
      });
    }

    // Add users with pending invites
    if (invitesResult.data) {
      invitesResult.data.forEach((invite) => {
        const otherUserId =
          invite.requester_id === userId
            ? invite.requestee_id
            : invite.requester_id;
        excludedUserIds.add(otherUserId);
      });
    }

    // Search for users by name
    const { data: profiles, error: searchError } = await supabase
      .from("profiles")
      .select("profile_id, name, studiengang, university, user_id")
      .ilike("name", `%${searchTerm.trim()}%`)
      .not("user_id", "in", `(${Array.from(excludedUserIds).join(",")})`)
      .limit(20);

    if (searchError) {
      console.error("Error searching users:", searchError);
      return {
        success: false,
        message: "Error searching users",
      };
    }

    return {
      success: true,
      message: `Found ${profiles?.length || 0} users`,
      users: profiles || [],
    };
  } catch (error) {
    console.error("Unexpected error in searchUsers:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}
