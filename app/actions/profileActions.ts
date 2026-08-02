"use server";

import { createClient } from "@/lib/supabase/server";

interface UserStats {
  totalSwiped: number;
  watchlistCount: number;
  likedCount: number;
  watchedCount: number;
}

/**
 * Aggregates real-time swipe analytics directly from Supabase.
 */
export async function fetchUserProfileStats(): Promise<{ success: boolean; data?: UserStats; error?: string }> {
  const supabase = await createClient();

  // 1. Authenticate session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    // 2. Fetch user swipes count in a single round-trip
    const { data: swipes, error: queryError } = await supabase
      .from("user_swipes")
      .select("action")
      .eq("user_id", user.id);

    if (queryError) throw queryError;

    const totalSwiped = swipes?.length || 0;
    const watchlistCount = swipes?.filter(s => s.action === "like").length || 0;
    const likedCount = swipes?.filter(s => s.action === "watched_like").length || 0;
    const watchedCount = swipes?.filter(s => s.action === "watched_like" || s.action === "watched_dislike").length || 0;

    return {
      success: true,
      data: {
        totalSwiped,
        watchlistCount,
        likedCount,
        watchedCount
      }
    };
  } catch (err: any) {
    console.error("Failed to fetch database profile metrics:", err.message);
    return { success: false, error: err.message };
  }
}