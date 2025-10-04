"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Camera, MapPin, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Activity {
  activity_id: string;
  user_id: string;
  place_id: string;
  time: string;
  picture: string | null;
  created_at: string;
  updated_at: string;
  places: {
    name: string;
    location: unknown;
  };
}

interface ActivityHistoryComponentProps {
  userId: string;
}

export function ActivityHistoryComponent({
  userId,
}: ActivityHistoryComponentProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("activities")
        .select(
          `
          *,
          places (
            name,
            location
          )
        `
        )
        .eq("user_id", userId)
        .order("time", { ascending: false })
        .limit(20);

      if (fetchError) {
        setError("Failed to load activities");
        console.error("Error fetching activities:", fetchError);
        return;
      }

      setActivities(data || []);
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Activity History</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Activity History</h3>
            <Button onClick={fetchActivities} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchActivities} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Activity History</h3>
          <Badge variant="outline">
            {activities.length}{" "}
            {activities.length === 1 ? "Activity" : "Activities"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No activities yet</p>
            <p className="text-sm text-muted-foreground">
              Start exploring and your activities will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const { date, time } = formatDate(activity.time);
              const timeSince = getTimeSince(activity.time);

              return (
                <div
                  key={activity.activity_id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                >
                  {/* Activity Icon/Picture */}
                  <div className="flex-shrink-0">
                    {activity.picture ? (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm truncate">
                          {activity.places?.name || "Unknown Location"}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {date} at {time}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {timeSince}
                      </div>
                    </div>

                    {/* Additional Activity Info */}
                    <div className="flex items-center gap-2 mt-2">
                      {activity.picture && (
                        <Badge variant="secondary" className="text-xs">
                          Photo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {activities.length >= 20 && (
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing recent 20 activities
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
