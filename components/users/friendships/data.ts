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
    const { data: friendships, error: friendshipsError } = await supabase
      .from("friendships")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (friendshipsError) {
      console.error("Error fetching friendships:", friendshipsError);
      return {
        success: false,
        message: "Error fetching friendships",
      };
    }

    if (!friendships || friendships.length === 0) {
      return {
        success: true,
        message: "No friendships found",
        data: [],
      };
    }

    // Get all unique friend user IDs
    const friendUserIds = friendships.map((friendship) =>
      friendship.user1_id === userId ? friendship.user2_id : friendship.user1_id
    );

    // Fetch profiles for all friends
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", friendUserIds);

    if (profilesError) {
      console.error("Error fetching friend profiles:", profilesError);
      return {
        success: false,
        message: "Error fetching friend profiles",
      };
    }

    // Combine friendship data with profile data
    const friendProfiles = friendships
      .map((friendship) => {
        const friendUserId =
          friendship.user1_id === userId
            ? friendship.user2_id
            : friendship.user1_id;
        const profile = profiles?.find((p) => p.user_id === friendUserId);

        if (!profile) {
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
      );

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
      .select("*")
      .eq("requestee_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Get sent invites (invites sent by the current user)
    const { data: sentInvites, error: sentError } = await supabase
      .from("friendship_invites")
      .select("*")
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

    // Get profiles for all relevant users
    const requesterIds =
      receivedInvites?.map((invite) => invite.requester_id) || [];
    const requesteeIds =
      sentInvites?.map((invite) => invite.requestee_id) || [];
    const allUserIds = [...requesterIds, ...requesteeIds];

    let profiles: any[] = [];
    if (allUserIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("profile_id, name, studiengang, university, user_id")
        .in("user_id", allUserIds);

      if (profilesError) {
        return {
          success: false,
          message: "Error fetching user profiles",
          data: null,
        };
      }
      profiles = profilesData || [];
    }

    // Combine invite data with profile data
    const receivedWithProfiles =
      receivedInvites?.map((invite) => ({
        ...invite,
        requester_profile: profiles.find(
          (p) => p.user_id === invite.requester_id
        ),
      })) || [];

    const sentWithProfiles =
      sentInvites?.map((invite) => ({
        ...invite,
        requestee_profile: profiles.find(
          (p) => p.user_id === invite.requestee_id
        ),
      })) || [];

    return {
      success: true,
      message: "Friendship invites fetched successfully",
      data: {
        received: receivedWithProfiles,
        sent: sentWithProfiles,
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
