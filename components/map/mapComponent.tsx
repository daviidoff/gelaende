import React from "react";
import {
  getFriendsWithLastPlaces,
  FriendWithLastPlace,
} from "@/components/users/friendships/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Utility function to format relative time
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
}

// Function to get place name from the lastPlace data
function getPlaceName(lastPlace: FriendWithLastPlace["lastPlace"]): string {
  if (!lastPlace || !lastPlace.places) {
    return "Location unknown";
  }

  if (Array.isArray(lastPlace.places)) {
    return lastPlace.places.map((place) => place.name).join(", ");
  } else {
    return lastPlace.places.name;
  }
}

// Friend location card component
function FriendLocationCard({ friend }: { friend: FriendWithLastPlace }) {
  const placeName = getPlaceName(friend.lastPlace);
  const timeAgo = friend.lastPlace?.time
    ? formatRelativeTime(friend.lastPlace.time)
    : "No recent activity";

  return (
    <Card className="w-full transition-all hover:shadow-lg border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>{friend.name}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {timeAgo}
          </span>
        </CardTitle>
        {(friend.studiengang || friend.university) && (
          <p className="text-sm text-muted-foreground">
            {friend.studiengang}
            {friend.studiengang && friend.university && " • "}
            {friend.university}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
              📍
            </span>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">
                {placeName}
              </span>
            </div>
          </div>
          {friend.lastPlace?.time && (
            <div className="text-xs text-muted-foreground ml-8">
              Last updated: {new Date(friend.lastPlace.time).toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Map Component
export default async function MapComponent() {
  const friendsResult = await getFriendsWithLastPlaces();

  if (!friendsResult.success || !friendsResult.data) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Friends Map</h2>
          <div className="text-muted-foreground">
            <p>{friendsResult.message || "Failed to load friends locations"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Sort friends by most recent activity (latest first)
  const sortedFriends = [...friendsResult.data].sort((a, b) => {
    const timeA = a.lastPlace?.time ? new Date(a.lastPlace.time).getTime() : 0;
    const timeB = b.lastPlace?.time ? new Date(b.lastPlace.time).getTime() : 0;
    return timeB - timeA; // Most recent first
  });

  const friendsWithActivities = sortedFriends.filter(
    (friend) => friend.lastPlace
  );
  const friendsWithoutActivities = sortedFriends.filter(
    (friend) => !friend.lastPlace
  );

  return (
    <div className="w-full p-6 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Friends Map</h2>
        <p className="text-muted-foreground">
          See where your friends were last spotted, sorted by most recent
          activity
        </p>
      </div>

      {friendsWithActivities.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Recent Activity ({friendsWithActivities.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {friendsWithActivities.map((friend) => (
              <FriendLocationCard key={friend.profile_id} friend={friend} />
            ))}
          </div>
        </div>
      )}

      {friendsWithoutActivities.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-500 border-b pb-2">
            No Recent Activity ({friendsWithoutActivities.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {friendsWithoutActivities.map((friend) => (
              <Card key={friend.profile_id} className="w-full opacity-60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">
                    {friend.name}
                  </CardTitle>
                  {(friend.studiengang || friend.university) && (
                    <p className="text-sm text-muted-foreground">
                      {friend.studiengang}
                      {friend.studiengang && friend.university && " • "}
                      {friend.university}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs">
                      📍
                    </span>
                    <span className="text-sm">No recent activity</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sortedFriends.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <p className="text-lg mb-2">No friends to show</p>
            <p className="text-sm">
              Add some friends to see their locations on the map!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
