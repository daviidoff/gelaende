"use server";

import { getFriendships } from "@/components/users/friendships/data";
import { getCurrentPlace } from "@/components/users/places/data";

export interface FriendWithLastPlace {
  profile_id: string;
  name: string;
  studiengang: string | null;
  university: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  friendship_created_at: string;
  lastPlace: {
    activity_id: any;
    time: any;
    places:
      | {
          place_id: any;
          name: any;
          location: any;
        }
      | {
          place_id: any;
          name: any;
          location: any;
        }[];
  } | null;
}

export interface GetFriendsWithLastPlacesResult {
  success: boolean;
  message: string;
  data?: FriendWithLastPlace[];
}

/**
 * Fetches all the user's friends along with their last visited place
 * @returns Promise with success status, message, and array of friends with their last places
 */
export async function getFriendsWithLastPlaces(): Promise<GetFriendsWithLastPlacesResult> {
  try {
    // Get all friends
    const friendshipsResult = await getFriendships();

    if (!friendshipsResult.success || !friendshipsResult.data) {
      return {
        success: false,
        message: friendshipsResult.message,
      };
    }

    // For each friend, get their last place
    const friendsWithPlaces = await Promise.all(
      friendshipsResult.data.map(async (friend) => {
        const lastPlaceResult = await getCurrentPlace(friend.user_id);

        return {
          ...friend,
          lastPlace:
            lastPlaceResult.success && lastPlaceResult.activity
              ? lastPlaceResult.activity
              : null,
        };
      })
    );

    return {
      success: true,
      message: "Friends with last places fetched successfully",
      data: friendsWithPlaces,
    };
  } catch (error) {
    console.error("Unexpected error in getFriendsWithLastPlaces:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}
