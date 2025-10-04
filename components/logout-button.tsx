"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();

    // Clear the profile cache cookie
    document.cookie =
      "has_profile=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    router.push("/auth/login");
  };

  return <Button onClick={logout}>Logout</Button>;
}
