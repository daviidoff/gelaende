import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Camera } from "lucide-react";
import { FriendWithLastPlace } from "@/components/users/friendships/data";

// BeReal-style time formatting function
function formatBeRealTime(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);

  // Check if the past date is valid
  if (isNaN(past.getTime())) {
    return "Invalid date";
  }

  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // Handle future dates with a small tolerance for timing differences
  // Allow up to 10 seconds of "future" time to account for network latency,
  // database processing time, and clock synchronization differences
  if (diffInSeconds < -10) {
    return "In the future";
  }

  // If the difference is slightly negative (within 10 seconds), treat it as "just now"
  if (diffInSeconds < 0) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);

  // Less than 1 hour: show "X min ago"
  if (diffInHours < 1) {
    if (diffInMinutes < 1) {
      return "Just now";
    }
    return `${diffInMinutes} min ago`;
  }

  // Check if it's the same day
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const pastDate = new Date(
    past.getFullYear(),
    past.getMonth(),
    past.getDate()
  );

  if (nowDate.getTime() === pastDate.getTime()) {
    // Same day: show time in HH:MM format
    return past.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  // Different day: show date in MMM DD format
  return past.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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

// Friend location card component with BeReal-style layout
export function FriendLocationCard({
  friend,
}: {
  friend: FriendWithLastPlace;
}) {
  const placeName = getPlaceName(friend.lastPlace);
  const timeDisplay = friend.lastPlace?.time
    ? formatBeRealTime(friend.lastPlace.time)
    : "No recent activity";

  return (
    <div className="space-y-3">
      {/* BeReal-style user header */}
      <div className="flex items-center gap-3">
        {/* Profile picture placeholder */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
          {friend.name.charAt(0).toUpperCase()}
        </div>

        {/* Name and time */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-base">
              {friend.name}
            </h3>
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
          </div>
          <p className="text-sm text-slate-400 leading-tight">{timeDisplay}</p>
        </div>
      </div>

      {/* Activity picture (if available) */}
      {friend.lastPlace?.picture && (
        <div className="rounded-lg overflow-hidden border border-slate-700/50">
          <img
            src={friend.lastPlace.picture}
            alt="Activity picture"
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Location card */}
      <Card className="bg-slate-800/90 border-slate-700/50 hover:border-slate-600/70 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 mt-0.5 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm leading-tight">
                {placeName}
              </h4>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Card for friends without recent activity
export function NoActivityCard({ friend }: { friend: FriendWithLastPlace }) {
  return (
    <div className="space-y-3 opacity-60">
      {/* BeReal-style user header */}
      <div className="flex items-center gap-3">
        {/* Profile picture placeholder */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-slate-300 font-semibold text-lg">
          {friend.name.charAt(0).toUpperCase()}
        </div>

        {/* Name and time */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-300 text-base">
              {friend.name}
            </h3>
            <div className="w-2 h-2 rounded-full bg-slate-500" />
          </div>
          <p className="text-sm text-slate-500 leading-tight">
            No recent activity
          </p>
        </div>
      </div>

      {/* Location card */}
      <Card className="bg-slate-800/50 border-slate-700/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <span className="text-sm text-slate-500">Location not shared</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Card for the current user with change place button
export function UserLocationCard({ user }: { user: FriendWithLastPlace }) {
  const placeName = getPlaceName(user.lastPlace);
  const timeDisplay = user.lastPlace?.time
    ? formatBeRealTime(user.lastPlace.time)
    : "No recent activity";

  return (
    <div className="space-y-3">
      {/* BeReal-style user header */}
      <div className="flex items-center gap-3">
        {/* Profile picture placeholder with special styling for current user */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg ring-2 ring-indigo-400/30">
          {user.name.charAt(0).toUpperCase()}
        </div>

        {/* Name and time */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-base">{user.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              You
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-tight">{timeDisplay}</p>
        </div>
      </div>

      {/* Activity picture (if available) */}
      {user.lastPlace?.picture && (
        <div className="rounded-lg overflow-hidden border border-slate-700/50">
          <img
            src={user.lastPlace.picture}
            alt="Your activity picture"
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Location card with change place button */}
      <Card className="bg-slate-800/90 border-slate-700/50 hover:border-slate-600/70 transition-colors">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 mt-0.5 text-indigo-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm leading-tight">
                {placeName}
              </h4>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Link href="/map/addActivity" className="block">
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                size="sm"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Change Place
              </Button>
            </Link>

            {user.lastPlace && (
              <Link href="/map/addPicture" className="block">
                <Button
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  size="sm"
                  variant="outline"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {user.lastPlace.picture ? "Update Picture" : "Add Picture"}
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
