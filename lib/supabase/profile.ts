import { createClient } from "./server";

/**
 * Checks if the current authenticated user has a profile
 * @returns Object with hasProfile boolean and user_id if authenticated
 */
export async function checkUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { hasProfile: false, user: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("profile_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error checking profile:", profileError);
    return { hasProfile: false, user };
  }

  return {
    hasProfile: !!profile,
    user,
    profile,
  };
}
