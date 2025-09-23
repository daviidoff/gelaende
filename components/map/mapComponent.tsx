import React from "react";
import {
  getFriendsWithLastPlaces,
  FriendWithLastPlace,
} from "@/components/users/friendships/data";
import { FriendLocationCard, NoActivityCard } from "@/components/map/mapCard";

// Main Map Component
export default async function MapComponent() {
  const friendsResult = await getFriendsWithLastPlaces();

  if (!friendsResult.success || !friendsResult.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 flex items-center justify-center text-3xl border border-red-500/30">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-white">Friends Map</h2>
          <div className="text-slate-400 max-w-md">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 space-y-8">
      {/* Hero Header Section */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent mb-4">
            Friends Map
          </h2>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-teal-500/20 blur-lg -z-10" />
        </div>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Discover where your friends were last spotted, sorted by most recent
          activity
        </p>
      </div>

      {friendsWithActivities.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full shadow-lg" />
            <h3 className="text-xl font-bold text-white">
              Recent Activity
              <span className="ml-2 text-sm font-medium px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {friendsWithActivities.length}
              </span>
            </h3>
          </div>
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
            <div className="w-2 h-8 bg-gradient-to-b from-slate-500 to-slate-600 rounded-full shadow-lg opacity-60" />
            <h3 className="text-xl font-bold text-slate-400">
              No Recent Activity
              <span className="ml-2 text-sm font-medium px-3 py-1 rounded-full bg-slate-500/20 text-slate-500 border border-slate-500/30">
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
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-center text-4xl opacity-60">
              👥
            </div>
            <div className="text-slate-400 space-y-2">
              <p className="text-2xl font-semibold">No friends to show</p>
              <p className="text-lg">
                Add some friends to see their locations on the map!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
