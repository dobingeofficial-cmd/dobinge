"use server";

import { createClient } from "@/lib/supabase/server";

interface SaveInteractionProps {
  mediaId: number;
  mediaType: "movie" | "tv";
  interactionType: "liked" | "disliked" | "watchlist";
}

/**
 * Commits user swipe data variants securely to the PostgreSQL cluster.
 * Ensures the system dynamically remembers context paths to build clean recommendation models.
 */
export async function saveUserInteraction({ mediaId, mediaType, interactionType }: SaveInteractionProps) {
  try {
    const supabase = await createClient();

    // Verify user authorization session integrity
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized session access." };
    }

    // Execute database write operation matching schema layouts
    const { data, error } = await supabase
      .from("interactions")
      .upsert(
        {
          user_id: user.id,
          media_id: mediaId,
          media_type: mediaType,
          interaction_type: interactionType,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id, media_id" }
      )
      .select();

    if (error) throw error;
    return { success: true, data };

  } catch (err: any) {
    console.error("DoBinge Transaction Pipeline Interruption:", err.message);
    return { success: false, error: err.message };
  }
}