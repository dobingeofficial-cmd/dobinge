import { supabaseAdmin } from '@/lib/supabase/admin';
import { RecCandidate } from '@/types/recommendation.types';

export class HardFilterEngine {
  /**
   * Sieve out watched, rejected, or invalid content in O(N) time.
   */
  static async filter(userId: string, candidates: RecCandidate[]): Promise<RecCandidate[]> {
    // 1. Fetch user's "Do Not Show" list (Watched + Rejected)
    const { data: invalidInteractions } = await supabaseAdmin
      .from('interactions')
      .select('media_id')
      .eq('user_id', userId)
      .in('interaction_type', ['SWIPE_WATCHED', 'SWIPE_REJECT']);

    const blocklist = new Set((invalidInteractions || []).map(i => i.media_id));

    // 2. Filter candidates
    const surviving = candidates.filter(c => {
      // Rule 1: Not already watched/rejected
      if (blocklist.has(c.mediaId)) return false;
      
      // Rule 2: Valid enrichment data exists
      if (!c.enrichment || !c.enrichment.genres) return false;

      // Future Rules: Region Locks, Platform Availability would go here
      
      return true;
    });

    console.log(`[Neural Core] Sieve applied: ${candidates.length} -> ${surviving.length} candidates remaining.`);
    return surviving;
  }
}