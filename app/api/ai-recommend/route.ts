import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userPrompt, userHistory } = await req.json();

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const tmdbApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    if (!tmdbApiKey) {
      return NextResponse.json({ error: "TMDB API Key unconfigured." }, { status: 500 });
    }

    const likedTitles = userHistory?.liked?.slice(0, 5).join(", ") || "None";
    const watchedTitles = userHistory?.watched?.slice(0, 5).join(", ") || "None";

    const systemPrompt = `
      You are DoBinge AI, an expert cinematic recommendations engineer.
      
      USER CONTEXT:
      - Liked: ${likedTitles}
      - Watched: ${watchedTitles}
      - PROMPT: "${userPrompt}"

      TASK: Analyze the user's intent. Output ONLY a raw valid JSON object without markdown formatting.

      JSON SCHEMA:
      {
        "isAnchorSearch": true, // Set true if the user mentions a specific movie/show as reference (e.g., "like REC", "similar to Interstellar")
        "anchorTitle": "REC", // Extract the exact title referenced, or null
        "mediaType": "movie", // "movie" or "tv"
        "aiResponse": "Since you're craving the intense, claustrophobic found-footage horror of [REC], here are similar visceral thrillers that deliver the same raw tension:",
        "queryParams": "&with_genres=27&with_keywords=161219", // Fallback query parameters if anchor lookup fails
        "fallbackSearchQueries": ["Grave Encounters", "Quarantine", "As Above So Below", "The Blair Witch Project"]
      }
    `;

    let parsedResult: any = null;

    // ── 1. PRIMARY LLM INFERENCE (GROQ / LLAMA 3.3) ──
    if (groqApiKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: systemPrompt }],
            temperature: 0.2,
            response_format: { type: "json_object" }
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          parsedResult = JSON.parse(groqData.choices[0].message.content);
        }
      } catch (e) {
        console.warn("Groq failover triggering Gemini...", e);
      }
    }

    // ── 2. SECONDARY LLM INFERENCE (GEMINI FAILOVER) ──
    if (!parsedResult && geminiApiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          parsedResult = JSON.parse(geminiData.candidates[0].content.parts[0].text);
        }
      } catch (e) {
        console.error("Gemini failover failed:", e);
      }
    }

    if (!parsedResult) {
      return NextResponse.json({ error: "AI Neural Core currently offline." }, { status: 500 });
    }

    const targetType = parsedResult.mediaType || "movie";
    let finalRecommendations: any[] = [];

    // ── 3. ANCHOR MOVIE RESOLUTION PIPELINE ──
    if (parsedResult.isAnchorSearch && parsedResult.anchorTitle) {
      try {
        // Step A: Search for the exact movie on TMDB
        const searchRes = await fetch(
          `https://api.themoviedb.org/3/search/${targetType}?api_key=${tmdbApiKey}&query=${encodeURIComponent(parsedResult.anchorTitle)}&page=1`
        );
        const searchData = await searchRes.json();
        const anchorMedia = searchData.results?.[0];

        if (anchorMedia?.id) {
          // Step B: Fetch direct algorithmic recommendations for this specific item
          const recsRes = await fetch(
            `https://api.themoviedb.org/3/${targetType}/${anchorMedia.id}/recommendations?api_key=${tmdbApiKey}&page=1`
          );
          const recsData = await recsRes.json();

          if (recsData.results && recsData.results.length > 0) {
            finalRecommendations = recsData.results;
          } else {
            // Fallback to "similar" endpoint if recommendations are sparse
            const similarRes = await fetch(
              `https://api.themoviedb.org/3/${targetType}/${anchorMedia.id}/similar?api_key=${tmdbApiKey}&page=1`
            );
            const similarData = await similarRes.json();
            finalRecommendations = similarData.results || [];
          }
        }
      } catch (err) {
        console.warn("Anchor resolution fallback triggered:", err);
      }
    }

    // ── 4. FALLBACK SPECIFIC SEARCH PIPELINE ──
    if (finalRecommendations.length === 0 && parsedResult.fallbackSearchQueries?.length > 0) {
      const searchPromises = parsedResult.fallbackSearchQueries.map(async (query: string) => {
        try {
          const res = await fetch(
            `https://api.themoviedb.org/3/search/${targetType}?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&page=1`
          );
          const data = await res.json();
          return data.results?.[0] || null;
        } catch {
          return null;
        }
      });

      const searchResults = await Promise.all(searchPromises);
      finalRecommendations = searchResults.filter(Boolean);
    }

    // ── 5. FINAL GENERIC DISCOVER FALLBACK ──
    if (finalRecommendations.length === 0) {
      const tmdbEndpoint = `https://api.themoviedb.org/3/discover/${targetType}?api_key=${tmdbApiKey}&sort_by=popularity.desc&page=1${parsedResult.queryParams || ""}`;
      const tmdbRes = await fetch(tmdbEndpoint);
      const tmdbData = await tmdbRes.json();
      finalRecommendations = tmdbData.results || [];
    }

    // Clean & Format Output
    const formattedCards = finalRecommendations
      .filter((item: any) => item && item.poster_path)
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        media_type: targetType
      }));

    return NextResponse.json({
      aiMessage: parsedResult.aiResponse,
      recommendations: formattedCards
    });

  } catch (error) {
    console.error("AI Recommendation Pipeline Error:", error);
    return NextResponse.json({ error: "Internal processing fault." }, { status: 500 });
  }
}