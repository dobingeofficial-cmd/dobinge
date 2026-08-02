import { supabaseAdmin } from '@/lib/supabase/admin';
import { PipelineContext, RecCandidate } from '@/types/recommendation.types';

export class CandidateGenerator {
  /**
   * Fetches ~1,000 potential candidates using broad strokes (Genres, Trending).
   * In a future scale-up, this will use pgvector ANN searches.
   */
  static async getCandidates(context: PipelineContext): Promise<RecCandidate[]> {
    console.log(`[Neural Core] Generating candidates for ${context.userId}...`);
    
    // For ₹0 budget, we pull recent high-quality enriched titles from our local DB
    // rather than doing live TMDB searches per user.
    const { data, error } = await supabaseAdmin
      .from('content_intelligence')
      .select('media_id, media_type, tmdb_metadata, ai_enrichment')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error || !data) {
      console.error("Candidate generation fault:", error);
      return [];
    }

    return data.map(row => ({
      mediaId: row.media_id,
      mediaType: row.media_type,
      tmdbData: row.tmdb_metadata,
      enrichment: row.ai_enrichment,
      baseScore: 0,
      finalScore: 0,
      confidenceScore: 0,
      penaltiesApplied: []
    }));
  }
}