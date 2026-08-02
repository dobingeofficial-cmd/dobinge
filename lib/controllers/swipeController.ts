import { createClient } from "@/lib/supabase/client";

export type SwipeActionType = 
  | "DISLIKE"
  | "WATCHLIST"
  | "WATCHED_LIKED"
  | "WATCHED_NOT_LIKED";

export async function processSwipe(action: SwipeActionType, mediaId: number, mediaType: string) {
  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    throw new Error("Authentication required to save interactions.");
  }

  const userId = authData.user.id;
  const basePayload = { user_id: userId, media_id: mediaId, media_type: mediaType };
  const mutations: any[] = [];

  // STRICT DECISION TREE
  switch (action) {
    case "DISLIKE":
      mutations.push({ ...basePayload, interaction_type: "disliked" });
      break;

    case "WATCHLIST":
      mutations.push({ ...basePayload, interaction_type: "watchlist" });
      break;

    case "WATCHED_LIKED":
      // ATOMIC DUAL-SAVE
      mutations.push({ ...basePayload, interaction_type: "watched" });
      mutations.push({ ...basePayload, interaction_type: "liked" });
      break;

    case "WATCHED_NOT_LIKED":
      mutations.push({ ...basePayload, interaction_type: "watched" });
      break;
  }

  // ATOMIC DATABASE EXECUTION
  // HARD FIX: Removed spaces in onConflict string. PostgREST strictly requires comma-separated values without spaces.
  const { error } = await supabase
    .from("interactions")
    .upsert(mutations, { onConflict: 'user_id,media_id,interaction_type' });

  if (error) {
    // Aggressive error serialization to prevent silent {} console logs
    const errorMessage = error.message || error.details || error.hint || JSON.stringify(error);
    console.error("Controller Mutation Failed:", errorMessage);
    throw new Error(errorMessage);
  }

  return true;
}