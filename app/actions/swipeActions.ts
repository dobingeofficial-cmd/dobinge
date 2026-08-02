"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface RecordSwipeParams {
  mediaId: number;
  mediaType: "movie" | "tv";
  interactionType: "liked" | "disliked" | "watchlist";
}

/**
 * Commits a user's swipe action securely to the Supabase PostgreSQL cluster
 * Leverages Row Level Security matching the active session auth.uid()
 */
export async function recordSwipeAction({ mediaId, mediaType, interactionType }: RecordSwipeParams) {
  try {
    const supabase = await createClient();

    // 1. Verify user session validity before executing write mutations
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication session expired or invalid." };
    }

    // 2. Perform transactional upsert directly into our secured public.interactions schema
    const { error } = await supabase
      .from("interactions")
      .upsert(
        {
          user_id: user.id,
          media_id: mediaId,
          media_type: mediaType,
          interaction_type: interactionType,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id, media_id" } // Prevent duplication locks
      );

    if (error) {
      console.error("Supabase Database write mismatch:", error.message);
      return { success: false, error: error.message };
    }

    // 3. Purge Next.js routing cache layouts asynchronously to keep views snappy
    revalidatePath("/home");
    return { success: true };

  } catch (catchErr: any) {
    console.error("DoBinge Critical Swipe Pipeline Failure:", catchErr);
    return { success: false, error: "Internal engine communication drop." };
  }
}