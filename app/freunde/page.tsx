import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";

export default async function FreundePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page - only authenticated users can access it
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h1 className="font-bold text-3xl mb-4">Freunde</h1>
        <p className="text-muted-foreground">
          Welcome to your friends page! This content is only visible to authenticated users.
        </p>
      </div>
    </div>
  );
}