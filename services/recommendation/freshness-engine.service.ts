import { supabaseAdmin } from '@/lib/supabase/admin';
import { RecCandidate } from '@/types/recommendation.types';

export class FreshnessEngine {
  /**
   * Decays scores based on how many times the user ignored this card.
   */
  static async applyImpressionDecay(userId: string, candidates: RecCandidate[]): Promise<RecCandidate[]> {
    // 1. Fetch user impression history
    const { data: impressions } = await supabaseAdmin
      .from('impressions')
      .select('media_id, ignored_count')
      .eq('user_id', userId);

    const impressionMap = new Map((impressions || []).map(i => [i.media_id, i.ignored_count]));

    return candidates.filter(candidate => {
      const ignoredCount = impressionMap.get(candidate.mediaId) || 0;
      
      // Cooldown Void (Banished for 30 days if ignored 5 times)
      if (ignoredCount >= 5) {
        return false; 
      }

      // Logarithmic Penalty: 1 ignore = -5pts, 2 = -9pts, 3 = -12pts
      if (ignoredCount > 0) {
        const decay = Math.round(5 * Math.log(ignoredCount + 1));
        candidate.finalScore -= decay;
        candidate.penaltiesApplied.push(`Freshness:-${decay}`);
      }
      return true;
    }).sort((a, b) => b.finalScore - a.finalScore); // Re-sort
  }
}