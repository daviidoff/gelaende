import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function FriendsPage() {
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Friends</h1>
          <Link
            href="/friends/add"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Add Friends
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-center py-8">
            Friends functionality is coming soon!
            <br />
            In the meantime, you can{" "}
            <Link href="/friends/add" className="text-blue-600 hover:underline">
              add new friends
            </Link>{" "}
            or check out the{" "}
            <Link href="/map" className="text-blue-600 hover:underline">
              friends map
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
