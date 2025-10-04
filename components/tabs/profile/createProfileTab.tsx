"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createProfile,
  type CreateProfileData,
  type CreateProfileResult,
} from "../../tabs/profile/actions";

export function CreateProfileTab({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [studiengang, setStudiengang] = useState("");
  const [university, setUniversity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const profileData: CreateProfileData = {
        name: name.trim(),
        studiengang: studiengang.trim() || undefined,
        university: university.trim() || undefined,
      };

      const result: CreateProfileResult = await createProfile(profileData);

      if (result.success) {
        setSuccess(true);
        // Redirect to the main app after a short delay
        setTimeout(() => {
          router.push("/map");
          router.refresh();
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Profile Created!</CardTitle>
            <CardDescription>Redirecting you to the app...</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your profile has been successfully created. You&apos;ll be
              redirected to the app shortly.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Profile</CardTitle>
            <CardDescription>
              Set up your profile to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProfile}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="studiengang">Studiengang</Label>
                  <Input
                    id="studiengang"
                    type="text"
                    placeholder="Your field of study (optional)"
                    value={studiengang}
                    onChange={(e) => setStudiengang(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    type="text"
                    placeholder="Your university (optional)"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Profile..." : "Create Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
