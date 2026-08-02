import { supabaseAdmin } from '@/lib/supabase/admin';
import { ContentIntelligenceRecord, ContentEnrichment } from '@/types/content.types';
import { CONTENT_ANALYSIS_PROMPT } from '@/lib/ai/prompts';

// We use Google Gemini API for ₹0 budget AI enrichment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const CURRENT_AI_VERSION = 'gemini-1.5-flash-v1'; // Track this to force re-analysis later if needed

export class ContentIntelligenceEngine {
  
  /**
   * Primary Entry Point: Retrieves cached intelligence or generates it on the fly.
   */
  public static async getOrGenerateIntelligence(
    mediaId: number, 
    mediaType: 'movie' | 'tv' | 'anime'
  ): Promise<ContentEnrichment | null> {
    
    // 1. Check Permanent Cache (Supabase)
    const { data: cached } = await supabaseAdmin
      .from('content_intelligence')
      .select('ai_enrichment, ai_model_version')
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .single();

    // Cache Hit: Return instantly at 0ms cost
    if (cached && cached.ai_model_version === CURRENT_AI_VERSION) {
      return cached.ai_enrichment as ContentEnrichment;
    }

    // Cache Miss (or outdated model): Generate new intelligence
    console.log(`[Neural Core] JIT Enrichment triggered for ${mediaType}:${mediaId}`);
    return await this.generateAndCacheIntelligence(mediaId, mediaType);
  }

  /**
   * Orchestrates the TMDB fetch, AI analysis, and database caching.
   */
  private static async generateAndCacheIntelligence(
    mediaId: number, 
    mediaType: 'movie' | 'tv' | 'anime'
  ): Promise<ContentEnrichment | null> {
    try {
      // 1. Fetch deep metadata from TMDB
      const tmdbType = mediaType === 'anime' ? 'tv' : mediaType;
      const tmdbRes = await fetch(
        `https://api.themoviedb.org/3/${tmdbType}/${mediaId}?api_key=${TMDB_API_KEY}&append_to_response=keywords,credits`
      );
      
      if (!tmdbRes.ok) throw new Error("TMDB fetch failed");
      const tmdbData = await tmdbRes.json();

      // 2. Format payload for the AI
      const payloadToAnalyze = JSON.stringify({
        title: tmdbData.title || tmdbData.name,
        overview: tmdbData.overview,
        genres: tmdbData.genres?.map((g: any) => g.name),
        keywords: tmdbData.keywords?.keywords?.map((k: any) => k.name) || tmdbData.keywords?.results?.map((k: any) => k.name)
      });

      // 3. Call AI LLM (Gemini Flash is insanely fast and free)
      const aiEnrichment = await this.callLLM(payloadToAnalyze);

      if (!aiEnrichment) throw new Error("AI Enrichment failed to parse");

      // 4. Save to Supabase Cache
      await supabaseAdmin
        .from('content_intelligence')
        .upsert({
          media_id: mediaId,
          media_type: mediaType,
          tmdb_metadata: tmdbData,
          ai_enrichment: aiEnrichment,
          ai_model_version: CURRENT_AI_VERSION,
          updated_at: new Date().toISOString()
        }, { onConflict: 'media_id, media_type' });

      return aiEnrichment;

    } catch (error) {
      console.error("[Neural Core] Enrichment Fault:", error);
      return null;
    }
  }

  /**
   * Pure HTTP call to Gemini API to avoid installing massive SDK dependencies.
   */
  private static async callLLM(contentPayload: string): Promise<ContentEnrichment | null> {
    if (!GEMINI_API_KEY) {
      console.warn("Missing GEMINI_API_KEY. Bypassing AI enrichment.");
      return null;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: CONTENT_ANALYSIS_PROMPT + contentPayload }] }],
          generationConfig: {
            temperature: 0.2, // Low temperature for deterministic JSON output
            responseMimeType: "application/json", // Forces Gemini to return pure JSON
          }
        })
      });

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) return null;
      return JSON.parse(rawText) as ContentEnrichment;

    } catch (error) {
      console.error("LLM Parsing Error:", error);
      return null;
    }
  }
}