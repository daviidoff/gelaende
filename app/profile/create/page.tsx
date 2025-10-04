import { CreateProfileTab } from "@/components/tabs/profile/createProfileTab";
import { checkUserProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";

export default async function Page() {
  // Check if user already has a profile
  const { hasProfile, user } = await checkUserProfile();

  // If user has a profile, redirect to map page
  if (user && hasProfile) {
    redirect("/map");
  }

  // If not authenticated, redirect to login
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <CreateProfileTab />
      </div>
    </div>
  );
}
