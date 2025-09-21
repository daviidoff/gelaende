import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddFriends from "@/components/users/friendships/addFriends";
import ManageInvites from "@/components/users/friendships/manageInvites";

export default async function AddFriendsPage() {
  // Check if user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AddFriends />
      <ManageInvites />
    </div>
  );
}
