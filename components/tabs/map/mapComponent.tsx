import {
  FriendLocationCard,
  NoActivityCard,
  UserLocationCard,
} from "@/components/tabs/map/mapCard";
import {
  getCurrentUserWithLastPlace,
  getFriendsWithLastPlaces,
} from "@/components/users/friendships/data";

// Main Map Component
export default async function MapComponent() {
  // Fetch both current user and friends data
  const [currentUserResult, friendsResult] = await Promise.all([
    getCurrentUserWithLastPlace(),
    getFriendsWithLastPlaces(),
  ]);

  // Handle errors for friends data
  if (!friendsResult.success || !friendsResult.data) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center text-3xl border">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-foreground">Friends Map</h2>
          <div className="text-muted-foreground max-w-md">
            <p className="text-lg">
              {friendsResult.message || "Failed to load friends locations"}
            </p>
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Current User Section */}
        {currentUserResult.success && currentUserResult.data && (
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <UserLocationCard user={currentUserResult.data} />
            </div>
          </div>
        )}

        {friendsWithActivities.length > 0 && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {friendsWithActivities.map((friend) => (
                <FriendLocationCard key={friend.profile_id} friend={friend} />
              ))}
            </div>
          </div>
        )}

        {friendsWithoutActivities.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-foreground">
                No Recent Activity
                <span className="ml-2 text-sm font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground border">
                  {friendsWithoutActivities.length}
                </span>
              </h3>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {friendsWithoutActivities.map((friend) => (
                <NoActivityCard key={friend.profile_id} friend={friend} />
              ))}
            </div>
          </div>
        )}

        {sortedFriends.length === 0 && (
          <div className="text-center py-20">
            <div className="relative">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center text-4xl">
                👥
              </div>
              <div className="text-muted-foreground space-y-2">
                <p className="text-2xl font-semibold">No friends to show</p>
                <p className="text-lg">
                  Add some friends to see their locations on the map!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
