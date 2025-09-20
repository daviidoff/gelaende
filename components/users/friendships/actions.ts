"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  FriendshipInviteInsert,
  FriendshipInsert,
} from "@/lib/types/database";

export interface CreateFriendshipInviteResult {
  success: boolean;
  message: string;
  inviteId?: string;
}

/**
 * Creates a friendship invite from the current user to another user
 * @param requesteeId - The ID of the user to send the invite to
 * @returns Promise with success status and message
 */
export async function createFriendshipInvite(
  requesteeId: string
): Promise<CreateFriendshipInviteResult> {
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

    const requesterId = user.id;

    // Prevent users from sending invites to themselves
    if (requesterId === requesteeId) {
      return {
        success: false,
        message: "You cannot send a friendship invite to yourself",
      };
    }

    // Check if the requestee user exists (has a profile)
    const { data: requesteeProfile, error: profileError } = await supabase
      .from("profiles")
      .select("profile_id")
      .eq("user_id", requesteeId)
      .single();

    if (profileError || !requesteeProfile) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Check if users are already friends
    const { data: existingFriendship, error: friendshipCheckError } =
      await supabase
        .from("friendships")
        .select("friendship_id")
        .or(
          `and(user1_id.eq.${requesterId},user2_id.eq.${requesteeId}),and(user1_id.eq.${requesteeId},user2_id.eq.${requesterId})`
        )
        .maybeSingle();

    if (friendshipCheckError) {
      return {
        success: false,
        message: "Error checking existing friendship",
      };
    }

    if (existingFriendship) {
      return {
        success: false,
        message: "You are already friends with this user",
      };
    }

    // Check if there's already a pending invite between these users
    const { data: existingInvite, error: inviteCheckError } = await supabase
      .from("friendship_invites")
      .select("invite_id, status, requester_id")
      .or(
        `and(requester_id.eq.${requesterId},requestee_id.eq.${requesteeId}),and(requester_id.eq.${requesteeId},requestee_id.eq.${requesterId})`
      )
      .eq("status", "pending")
      .maybeSingle();

    if (inviteCheckError) {
      return {
        success: false,
        message: "Error checking existing invites",
      };
    }

    if (existingInvite) {
      if (existingInvite.requester_id === requesterId) {
        return {
          success: false,
          message: "You have already sent a friendship invite to this user",
        };
      } else {
        return {
          success: false,
          message:
            "This user has already sent you a friendship invite. Please check your pending invites.",
        };
      }
    }

    // Create the friendship invite
    const inviteData: FriendshipInviteInsert = {
      requester_id: requesterId,
      requestee_id: requesteeId,
      status: "pending",
    };

    const { data: newInvite, error: insertError } = await supabase
      .from("friendship_invites")
      .insert(inviteData)
      .select("invite_id")
      .single();

    if (insertError) {
      console.error("Error creating friendship invite:", insertError);
      return {
        success: false,
        message: "Failed to send friendship invite",
      };
    }

    // Revalidate relevant paths to update UI
    revalidatePath("/protected");
    revalidatePath("/friends");

    return {
      success: true,
      message: "Friendship invite sent successfully!",
      inviteId: newInvite.invite_id,
    };
  } catch (error) {
    console.error("Unexpected error in createFriendshipInvite:", error);
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

export interface AcceptFriendshipInviteResult {
  success: boolean;
  message: string;
  friendshipId?: string;
}

/**
 * Accepts a pending friendship invite and creates a friendship
 * @param inviteId - The ID of the invite to accept
 * @returns Promise with success status and message
 */
export async function acceptFriendshipInvite(
  inviteId: string
): Promise<AcceptFriendshipInviteResult> {
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

    // Get the invite details
    const { data: invite, error: inviteError } = await supabase
      .from("friendship_invites")
      .select("invite_id, requester_id, requestee_id, status")
      .eq("invite_id", inviteId)
      .single();

    if (inviteError || !invite) {
      return {
        success: false,
        message: "Friendship invite not found",
      };
    }

    // Verify the current user is the requestee
    if (invite.requestee_id !== user.id) {
      return {
        success: false,
        message: "You are not authorized to accept this invite",
      };
    }

    // Check if the invite is still pending
    if (invite.status !== "pending") {
      return {
        success: false,
        message: `This invite has already been ${invite.status}`,
      };
    }

    // Check if a friendship already exists between these users
    const { data: existingFriendship, error: friendshipCheckError } =
      await supabase
        .from("friendships")
        .select("friendship_id")
        .or(
          `and(user1_id.eq.${invite.requester_id},user2_id.eq.${invite.requestee_id}),and(user1_id.eq.${invite.requestee_id},user2_id.eq.${invite.requester_id})`
        )
        .maybeSingle();

    if (friendshipCheckError) {
      return {
        success: false,
        message: "Error checking existing friendship",
      };
    }

    if (existingFriendship) {
      return {
        success: false,
        message: "Friendship already exists between these users",
      };
    }

    // Start a transaction to update invite and create friendship
    const { data: updatedInvite, error: updateError } = await supabase
      .from("friendship_invites")
      .update({
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("invite_id", inviteId)
      .select("invite_id")
      .single();

    if (updateError || !updatedInvite) {
      return {
        success: false,
        message: "Failed to update invite status",
      };
    }

    // Create the friendship
    const friendshipData: FriendshipInsert = {
      user1_id: invite.requester_id,
      user2_id: invite.requestee_id,
    };

    const { data: newFriendship, error: friendshipError } = await supabase
      .from("friendships")
      .insert(friendshipData)
      .select("friendship_id")
      .single();

    if (friendshipError || !newFriendship) {
      // If friendship creation fails, revert the invite status
      await supabase
        .from("friendship_invites")
        .update({
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("invite_id", inviteId);

      return {
        success: false,
        message: "Failed to create friendship",
      };
    }

    // Revalidate relevant paths to update UI
    revalidatePath("/protected");
    revalidatePath("/friends");

    return {
      success: true,
      message: "Friendship invite accepted successfully!",
      friendshipId: newFriendship.friendship_id,
    };
  } catch (error) {
    console.error("Unexpected error in acceptFriendshipInvite:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

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
