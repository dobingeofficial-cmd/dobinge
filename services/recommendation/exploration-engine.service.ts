import { RecCandidate } from '@/types/recommendation.types';

export class ExplorationEngine {
  /**
   * Injects wildcards (high quality, low taste match) to safely expand horizons.
   */
  static injectWildcards(rankedCandidates: RecCandidate[], rawCandidates: RecCandidate[], targetCount: number = 20): RecCandidate[] {
    const safePicks = rankedCandidates.slice(0, Math.floor(targetCount * 0.90)); // Top 90%
    
    // Find Wildcards: High quality consensus, but base score wasn't high enough to rank top naturally
    const wildcards = rawCandidates
      .filter(c => !safePicks.find(s => s.mediaId === c.mediaId))
      .filter(c => c.enrichment.comfort_watch_score > 80 && c.baseScore < 50)
      .slice(0, Math.ceil(targetCount * 0.10)) // Bottom 10% of feed
      .map(c => {
        c.isWildcard = true;
        return c;
      });

    return [...safePicks, ...wildcards];
  }
}