"use server";

/**
 * DoBinge AI Vibe Engine - Production Route Middleware
 * Extracts anchor points from user text strings and maps them to live TMDB entities.
 */
export async function processVibePrompt(prompt: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_TMDB_API_KEY environment configuration.");
  }

  const cleanPrompt = prompt.trim();
  
  // ── STEP 1: PARSE INTENT SEEDS FROM USER INPUT ──
  let searchTitle = cleanPrompt;
  
  // Clean up typical colloquial conversational phrases to isolate the movie title entity
  const phrasesToRemove = [
    /something like/gi,
    /movies like/gi,
    /show like/gi,
    /anime like/gi,
    /i want to watch/gi,
    /give me/gi
  ];
  
  phrasesToRemove.forEach((regex) => {
    searchTitle = searchTitle.replace(regex, "");
  });
  
  searchTitle = searchTitle.trim();

  try {
    // ── STEP 2: QUERY LIVE PRODUCTION MULTI-SEARCH GRAPH ──
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(searchTitle)}&page=1`;
    const response = await fetch(searchUrl, { next: { revalidate: 3600 } }); // Cache results for 1 hour to optimize bandwidth
    
    if (!response.ok) {
      throw new Error("TMDB search validation failure.");
    }
    
    const searchData = await response.json();
    
    // ── STEP 3: FALLBACK CHECK FOR ZERO-MATCH INPUTS ──
    if (!searchData.results || searchData.results.length === 0) {
      return {
        type: "discover" as const,
        queryParams: "&with_genres=18", // Fallback to premium trending drama metrics if entity matching fails
        anchorTitle: "Discovery Protocol"
      };
    }

    // Isolate the highest-match candidate from the results
    const primaryAnchor = searchData.results[0];
    const resolvedTitle = primaryAnchor.title || primaryAnchor.name || "Target Anchor";
    const mediaType = primaryAnchor.media_type || "movie";

    // ── STEP 4: SHIP DYNAMIC CONTENT PIPELINE PACKETET ──
    // If it's a direct movie/series match, flag recommendation engines to pull related cluster networks
    return {
      type: "recommendations" as const,
      anchorMovieId: primaryAnchor.id,
      anchorTitle: resolvedTitle,
      mediaType: mediaType
    };

  } catch (error) {
    console.error("AI Vibe Engine core integration failure:", error);
    return {
      type: "discover" as const,
      queryParams: "&sort_by=popularity.desc",
      anchorTitle: "Emergency Discovery Feed"
    };
  }
}