"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Edit, LogOut, Share2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivityHistoryComponent } from "./ActivityHistoryComponent";

interface Profile {
  profile_id: string;
  name: string;
  studiengang: string | null;
  university: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ProfileComponentProps {
  initialProfile?: Profile | null;
}

export function ProfileComponent({ initialProfile }: ProfileComponentProps) {
  const [profile, setProfile] = useState<Profile | null>(
    initialProfile || null
  );
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!initialProfile) {
      fetchProfile();
    }
  }, [initialProfile]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Authentication required");
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          setError("No profile found. Please create a profile first.");
        } else {
          setError("Failed to load profile");
        }
        return;
      }

      setProfile(data);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleShareProfile = async () => {
    if (!profile) return;

    const profileUrl = `${window.location.origin}/profile/${profile.profile_id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name}'s Profile`,
          text: `Check out ${profile.name}'s profile on Geländer`,
          url: profileUrl,
        });
      } catch {
        // User canceled sharing or share failed
        await fallbackCopyToClipboard(profileUrl);
      }
    } else {
      await fallbackCopyToClipboard(profileUrl);
    }
  };

  const fallbackCopyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // You might want to show a toast notification here
      alert("Profile link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      alert("Failed to copy link");
    }
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-4 mt-4">
        <CardContent className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchProfile} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="mx-4 mt-4">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">No profile found</p>
          <Button onClick={() => router.push("/profile/create")}>
            Create Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Profile Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Profile</h2>
            <div className="flex gap-2">
              <Button
                onClick={handleShareProfile}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                onClick={handleEditProfile}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-start gap-6">
            {/* Profile Picture Placeholder */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
            </div>

            {/* Profile Information */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-semibold">{profile.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Member since{" "}
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Educational Information */}
              <div className="flex flex-wrap gap-2">
                {profile.studiengang && (
                  <Badge variant="secondary">{profile.studiengang}</Badge>
                )}
                {profile.university && (
                  <Badge variant="outline">{profile.university}</Badge>
                )}
              </div>

              {!profile.studiengang && !profile.university && (
                <p className="text-sm text-muted-foreground italic">
                  No educational information provided
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity History Section */}
      <ActivityHistoryComponent userId={profile.user_id} />
    </div>
  );
}
