"use server";

import { createClient } from "@/lib/supabase/server";

export interface GetFriendshipsResult {
  success: boolean;
  message: string;
  data?: {
    profile_id: string;
    name: string;
    studiengang: string | null;
    university: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
    friendship_created_at: string;
  }[];
}

/**
 * Gets all friends' profiles for the current user
 * @returns Promise with success status, message, and array of friend profiles
 */
export async function getFriendships(): Promise<GetFriendshipsResult> {
  try {
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

    // Get all friendships where the current user is either user1 or user2
    // Join with profiles to get friend information
    const { data: friendships, error: friendshipsError } = await supabase
      .from("friendships")
      .select(
        `
        friendship_id,
        user1_id,
        user2_id,
        created_at,
        user1_profile:profiles!friendships_user1_id_fkey(
          profile_id,
          name,
          studiengang,
          university,
          user_id,
          created_at,
          updated_at
        ),
        user2_profile:profiles!friendships_user2_id_fkey(
          profile_id,
          name,
          studiengang,
          university,
          user_id,
          created_at,
          updated_at
        )
      `
      )
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (friendshipsError) {
      console.error("Error fetching friendships:", friendshipsError);
      return {
        success: false,
        message: "Error fetching friendships",
      };
    }

    // Extract friend profiles (the profile that is NOT the current user)
    const friendProfiles =
      friendships
        ?.map((friendship) => {
          const isUser1 = friendship.user1_id === userId;
          const friendProfile = isUser1
            ? friendship.user2_profile
            : friendship.user1_profile;

          // Type assertion to handle the Supabase query result type
          const profile = friendProfile as any;

          if (!profile || Array.isArray(profile) || !profile.profile_id) {
            return null;
          }

          return {
            profile_id: profile.profile_id,
            name: profile.name,
            studiengang: profile.studiengang,
            university: profile.university,
            user_id: profile.user_id,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            friendship_created_at: friendship.created_at,
          };
        })
        .filter(
          (profile): profile is NonNullable<typeof profile> => profile !== null
        ) || [];

    return {
      success: true,
      message: "Friendships fetched successfully",
      data: friendProfiles,
    };
  } catch (error) {
    console.error("Unexpected error in getFriendships:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Gets all pending friendship invites for the current user (both sent and received)
 */
export async function getFriendshipInvites() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Authentication required",
        data: null,
      };
    }

    // Get received invites (invites sent to the current user)
    const { data: receivedInvites, error: receivedError } = await supabase
      .from("friendship_invites")
      .select(
        `
        invite_id,
        requester_id,
        status,
        created_at,
        requester_profile:profiles!friendship_invites_requester_id_fkey(
          profile_id,
          name,
          studiengang,
          university
        )
      `
      )
      .eq("requestee_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Get sent invites (invites sent by the current user)
    const { data: sentInvites, error: sentError } = await supabase
      .from("friendship_invites")
      .select(
        `
        invite_id,
        requestee_id,
        status,
        created_at,
        requestee_profile:profiles!friendship_invites_requestee_id_fkey(
          profile_id,
          name,
          studiengang,
          university
        )
      `
      )
      .eq("requester_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (receivedError || sentError) {
      return {
        success: false,
        message: "Error fetching friendship invites",
        data: null,
      };
    }

    return {
      success: true,
      message: "Friendship invites fetched successfully",
      data: {
        received: receivedInvites || [],
        sent: sentInvites || [],
      },
    };
  } catch (error) {
    console.error("Error in getFriendshipInvites:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      data: null,
    };
  }
}
