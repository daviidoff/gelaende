import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FriendWithLastPlace } from "@/components/users/friendships/data";

// Utility function to format relative time
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);

  // Check if the past date is valid
  if (isNaN(past.getTime())) {
    return "Invalid date";
  }

  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // Handle future dates
  if (diffInSeconds < 0) {
    return "In the future";
  }

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

// Get time-based gradient color
function getTimeGradient(timestamp?: string): string {
  if (!timestamp) return "from-gray-500/20 to-gray-600/20";

  const now = new Date();
  const past = new Date(timestamp);
  const diffInHours = Math.floor(
    (now.getTime() - past.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) return "from-emerald-500/30 to-teal-500/30"; // Very recent - green
  if (diffInHours < 6) return "from-blue-500/30 to-cyan-500/30"; // Recent - blue
  if (diffInHours < 24) return "from-amber-500/30 to-orange-500/30"; // Hours ago - amber
  if (diffInHours < 168) return "from-purple-500/30 to-pink-500/30"; // Days ago - purple
  return "from-gray-500/20 to-slate-600/20"; // Old - gray
}

// Friend location card component with enhanced dark mode styling
export function FriendLocationCard({
  friend,
}: {
  friend: FriendWithLastPlace;
}) {
  const placeName = getPlaceName(friend.lastPlace);
  const timeAgo = friend.lastPlace?.time
    ? formatRelativeTime(friend.lastPlace.time)
    : "No recent activity";

  const gradientClass = getTimeGradient(friend.lastPlace?.time);

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:border-slate-600/70 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}
      />

      {/* Animated border effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />

      <div className="relative z-10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center justify-between text-white group-hover:text-blue-100 transition-colors">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30" />
              {friend.name}
            </span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800/60 text-slate-300 border border-slate-600/50">
              {timeAgo}
            </span>
          </CardTitle>
          {(friend.studiengang || friend.university) && (
            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
              {friend.studiengang}
              {friend.studiengang && friend.university && " • "}
              {friend.university}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-sm">📍</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-white group-hover:text-blue-100 transition-colors block truncate">
                  {placeName}
                </span>
              </div>
            </div>
            {friend.lastPlace?.time && (
              <div className="text-xs text-slate-500 ml-11 group-hover:text-slate-400 transition-colors">
                Last updated: {new Date(friend.lastPlace.time).toLocaleString()}
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

// Card for friends without recent activity
export function NoActivityCard({ friend }: { friend: FriendWithLastPlace }) {
  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/10 opacity-75 hover:opacity-90">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-slate-600/10 opacity-50 group-hover:opacity-70 transition-opacity duration-300" />

      <div className="relative z-10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-300 group-hover:text-slate-200 transition-colors">
            <div className="w-3 h-3 rounded-full bg-slate-600 opacity-60" />
            {friend.name}
          </CardTitle>
          {(friend.studiengang || friend.university) && (
            <p className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors">
              {friend.studiengang}
              {friend.studiengang && friend.university && " • "}
              {friend.university}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center">
              <span className="text-sm opacity-60">📍</span>
            </div>
            <span className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors">
              No recent activity
            </span>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
