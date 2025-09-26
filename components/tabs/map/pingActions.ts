"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PingFriendResult {
  success: boolean;
  message: string;
}

/**
 * Sends a ping notification to a friend
 * @param friendId - The ID of the friend to ping
 * @returns Promise with success status and message
 */
export async function pingFriend(friendId: string): Promise<PingFriendResult> {
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

    const currentUserId = user.id;

    // Prevent users from pinging themselves
    if (currentUserId === friendId) {
      return {
        success: false,
        message: "You cannot ping yourself",
      };
    }

    // Verify the friend exists and is actually a friend
    const { data: friendship, error: friendshipError } = await supabase
      .from("friendships")
      .select("friendship_id")
      .or(
        `and(user1_id.eq.${currentUserId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${currentUserId})`
      )
      .maybeSingle();

    if (friendshipError) {
      console.error("Error checking friendship:", friendshipError);
      return {
        success: false,
        message: "Error verifying friendship",
      };
    }

    if (!friendship) {
      return {
        success: false,
        message: "You can only ping friends",
      };
    }

    // Get friend's profile for the notification
    const { data: friendProfile, error: profileError } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", friendId)
      .single();

    if (profileError || !friendProfile) {
      return {
        success: false,
        message: "Friend not found",
      };
    }

    // Get current user's profile
    const { data: currentUserProfile, error: currentProfileError } =
      await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", currentUserId)
        .single();

    if (currentProfileError || !currentUserProfile) {
      return {
        success: false,
        message: "User profile not found",
      };
    }

    // For now, we'll just log the ping. In a real implementation,
    // you would want to:
    // 1. Create a notifications table
    // 2. Insert a ping notification record
    // 3. Send a push notification or email
    // 4. Use real-time subscriptions for instant delivery

    console.log(
      `🔔 PING: ${currentUserProfile.name} pinged ${
        friendProfile.name
      } (${friendId}) at ${new Date().toISOString()}`
    );

    // TODO: In the future, add notification to database:
    // await supabase.from("notifications").insert({
    //   recipient_id: friendId,
    //   sender_id: currentUserId,
    //   type: "ping",
    //   message: `${currentUserProfile.name} pinged you!`,
    //   created_at: new Date().toISOString()
    // });

    // Revalidate paths where notifications might be shown
    revalidatePath("/map");
    revalidatePath("/friends");

    return {
      success: true,
      message: `Pinged ${friendProfile.name}!`,
    };
  } catch (error) {
    console.error("Unexpected error in pingFriend:", error);
    return {
      success: false,
      message: "An unexpected error occurred while sending ping",
    };
  }
}
