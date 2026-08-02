import { RecCandidate } from '@/types/recommendation.types';

export class DiversityEngine {
  /**
   * Applies Maximum Marginal Relevance (MMR) logic to prevent echo chambers.
   */
  static applyEntropy(candidates: RecCandidate[]): RecCandidate[] {
    const PENALTY = 15; // Point deduction for repetition
    const genreCounts: Record<string, number> = {};

    candidates.forEach((candidate, index) => {
      // Only penalize if they aren't the absolute top 3 safe picks
      if (index < 3) {
        candidate.enrichment.genres.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
        return; 
      }

      // Check for repetition
      let repetitionPenalty = 0;
      candidate.enrichment.genres.forEach(g => {
        if (genreCounts[g] && genreCounts[g] >= 2) {
          repetitionPenalty += PENALTY;
        }
      });

      if (repetitionPenalty > 0) {
        candidate.finalScore -= repetitionPenalty;
        candidate.penaltiesApplied.push(`Diversity:-${repetitionPenalty}`);
      }

      // Record this candidate's traits for subsequent items
      candidate.enrichment.genres.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
    });

    // Re-sort after applying entropy penalties
    return candidates.sort((a, b) => b.finalScore - a.finalScore);
  }
}