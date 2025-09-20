import {
  getFriendsWithLastPlaces,
  FriendWithLastPlace,
} from "@/components/freundeTab/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Utility function to format relative time
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMs = now.getTime() - time.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  } else {
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
    } else {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
    }
  }
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

// Friend card component
function FriendCard({ friend }: { friend: FriendWithLastPlace }) {
  const placeName = getPlaceName(friend.lastPlace);
  const timeAgo = friend.lastPlace?.time
    ? formatRelativeTime(friend.lastPlace.time)
    : "No recent activity";

  return (
    <Card className="w-full transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{friend.name}</CardTitle>
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
            <span className="text-sm font-medium">Last seen:</span>
            <span className="text-sm text-muted-foreground">{placeName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">When:</span>
            <span className="text-sm text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function FreundePage() {
  const friendsResult = await getFriendsWithLastPlaces();

  if (!friendsResult.success || !friendsResult.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Friends</h1>
        <div className="text-center text-muted-foreground">
          <p>{friendsResult.message || "Failed to load friends"}</p>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Friends</h1>

      {sortedFriends.length === 0 ? (
        <div className="text-center text-muted-foreground">
          <p>You don't have any friends yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedFriends.map((friend) => (
            <FriendCard key={friend.profile_id} friend={friend} />
          ))}
        </div>
      )}
    </div>
  );
}
