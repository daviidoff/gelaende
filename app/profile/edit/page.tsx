import { EditProfileForm } from "@/components/tabs/profile/EditProfileForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function EditProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Fetch current profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    if (profileError.code === "PGRST116") {
      // No profile found, redirect to create profile
      redirect("/profile/create");
    }

    throw new Error("Failed to load profile");
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground mt-2">
          Update your profile information
        </p>
      </div>

      <EditProfileForm initialProfile={profile} />
    </div>
  );
}
