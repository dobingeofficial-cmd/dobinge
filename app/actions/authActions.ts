"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Initiates secure OAuth PKCE redirection to Google's authentication servers.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  
  // Set up the origin dynamically (falling back to localhost:3000 in dev)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("OAuth init failure:", error.message);
    return { success: false, error: error.message };
  }

  // Redirect the user to the secure Google login screen
  if (data.url) {
    redirect(data.url);
  }
}