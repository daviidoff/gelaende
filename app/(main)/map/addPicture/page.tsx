"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PictureCapture from "@/components/activities/PictureCapture";
import {
  getUserLastActivity,
  updateActivityPicture,
} from "@/components/activities/actions";
import type { Database } from "@/lib/types/database";

type Activity = Database["public"]["Tables"]["activities"]["Row"];

export default function AddPicturePage() {
  const router = useRouter();
  const [lastActivity, setLastActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPictureSaving, setIsPictureSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's last activity on component mount
  useEffect(() => {
    async function fetchLastActivity() {
      try {
        const result = await getUserLastActivity();

        if (result.success && result.activity) {
          setLastActivity(result.activity);
        } else {
          setError(result.message || "No recent activity found");
        }
      } catch (err) {
        console.error("Error fetching last activity:", err);
        setError("Failed to load recent activity");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLastActivity();
  }, []);

  // Handle picture capture
  const handlePictureTaken = async (pictureData: string) => {
    if (!lastActivity) return;

    setIsPictureSaving(true);
    try {
      const result = await updateActivityPicture({
        activityId: lastActivity.activity_id,
        pictureData: pictureData,
      });

      if (result.success) {
        // Picture saved successfully, redirect to map
        router.push("/map");
      } else {
        setError(result.message || "Failed to save picture");
        setIsPictureSaving(false);
      }
    } catch (err) {
      console.error("Error saving picture:", err);
      setError("Failed to save picture");
      setIsPictureSaving(false);
    }
  };

  // Handle skipping picture capture
  const handleSkipPicture = () => {
    router.push("/map");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground">
            Loading your recent activity...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-lg font-medium">{error}</div>
          <p className="text-muted-foreground">
            You need to have a recent activity to add a picture. Try setting
            your location first.
          </p>
          <button
            onClick={() => router.push("/map")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  // Show picture capture interface with change place option
  return (
    <div className="max-w-md mx-auto space-y-4 p-4">
      {/* Action buttons row */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => router.push("/map/addActivity")}
          className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
        >
          Change Place
        </button>
        <button
          onClick={handleSkipPicture}
          className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
        >
          Back to Map
        </button>
      </div>

      {/* Picture capture component */}
      <PictureCapture
        onPictureTaken={handlePictureTaken}
        onSkip={handleSkipPicture}
        isLoading={isPictureSaving}
        title={
          lastActivity?.picture
            ? "Update your picture"
            : "Add a picture to your activity"
        }
        description={
          lastActivity?.picture
            ? "Take a new picture to replace your current one"
            : "Capture the moment at your current location!"
        }
      />
    </div>
  );
}
