import { PipelineContext, RecCandidate, ScoringWeights } from '@/types/recommendation.types';

export class ScoringEngine {
  // Configurable weights allowing algorithm tuning without code changes
  private static readonly WEIGHTS: ScoringWeights = {
    taste: 0.50,
    mood: 0.20,
    context: 0.15,
    quality: 0.15,
  };

  static scoreCandidates(candidates: RecCandidate[], ctx: PipelineContext): RecCandidate[] {
    return candidates.map(candidate => {
      let score = 0;

      // 1. Taste Similarity (Dot Product of User Profile vs Movie DNA)
      let tasteScore = 0;
      candidate.enrichment.genres.forEach(g => {
        tasteScore += (ctx.tasteProfile.genres?.[g] || 0);
      });
      // Normalize taste score (mock simplified normalization for speed)
      tasteScore = Math.min(Math.max(tasteScore * 5, 0), 100); 
      
      // 2. Mood Alignment
      let moodScore = 0;
      if (ctx.activeMood && candidate.enrichment.situational_tags.includes(ctx.activeMood)) {
        moodScore = 100;
      } else if (ctx.activeMood && candidate.enrichment.mood.includes(ctx.activeMood)) {
        moodScore = 75;
      }

      // 3. Contextual Fit (Time / Day)
      let contextScore = 50; // Baseline
      if (ctx.timeOfDay === 'late_night' && candidate.enrichment.mind_bending_score > 70) contextScore += 30;
      if (ctx.isWeekend && candidate.enrichment.pacing === 'Slow-Burn') contextScore += 25;
      if (!ctx.isWeekend && candidate.enrichment.pacing === 'Frenetic') contextScore += 25;

      // 4. Quality consensus
      const qualityScore = candidate.enrichment.comfort_watch_score || 50;

      // 5. Final Composite Formula
      score = (
        (tasteScore * this.WEIGHTS.taste) +
        (moodScore * this.WEIGHTS.mood) +
        (contextScore * this.WEIGHTS.context) +
        (qualityScore * this.WEIGHTS.quality)
      );

      candidate.baseScore = score;
      candidate.finalScore = score;
      candidate.confidenceScore = Math.round((tasteScore + qualityScore) / 2);

      return candidate;
    }).sort((a, b) => b.finalScore - a.finalScore);
  }
}