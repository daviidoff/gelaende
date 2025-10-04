"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateProfile, type UpdateProfileData } from "./actions";

interface Profile {
  profile_id: string;
  name: string;
  studiengang: string | null;
  university: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface EditProfileFormProps {
  initialProfile: Profile;
}

export function EditProfileForm({ initialProfile }: EditProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialProfile.name || "",
    studiengang: initialProfile.studiengang || "",
    university: initialProfile.university || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare update data - only include changed fields
      const updateData: UpdateProfileData = {};

      if (formData.name !== initialProfile.name) {
        updateData.name = formData.name;
      }

      if (formData.studiengang !== (initialProfile.studiengang || "")) {
        updateData.studiengang = formData.studiengang;
      }

      if (formData.university !== (initialProfile.university || "")) {
        updateData.university = formData.university;
      }

      // Check if any changes were made
      if (Object.keys(updateData).length === 0) {
        setError("No changes detected");
        return;
      }

      const result = await updateProfile(updateData);

      if (result.success) {
        setSuccess("Profile updated successfully!");
        // Redirect back to profile after a short delay
        setTimeout(() => {
          router.push("/profile");
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error updating profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const hasChanges =
    formData.name !== initialProfile.name ||
    formData.studiengang !== (initialProfile.studiengang || "") ||
    formData.university !== (initialProfile.university || "");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-xl font-semibold">Edit Profile</h2>
            <p className="text-sm text-muted-foreground">
              Update your profile information
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your name"
              required
              disabled={loading}
              maxLength={255}
            />
          </div>

          {/* Studiengang Field */}
          <div className="space-y-2">
            <Label htmlFor="studiengang">Course of Study</Label>
            <Input
              id="studiengang"
              type="text"
              value={formData.studiengang}
              onChange={(e) => handleInputChange("studiengang", e.target.value)}
              placeholder="e.g., Computer Science, Mathematics"
              disabled={loading}
              maxLength={255}
            />
          </div>

          {/* University Field */}
          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <Input
              id="university"
              type="text"
              value={formData.university}
              onChange={(e) => handleInputChange("university", e.target.value)}
              placeholder="e.g., University of Technology"
              disabled={loading}
              maxLength={255}
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-md bg-green-50 border border-green-200">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !hasChanges}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? "Saving..." : "Save Changes"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>

          {!hasChanges && !loading && (
            <p className="text-sm text-muted-foreground">
              Make changes to your profile information to enable saving.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
