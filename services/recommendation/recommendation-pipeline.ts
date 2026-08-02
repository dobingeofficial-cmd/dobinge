import { supabaseAdmin } from '@/lib/supabase/admin';
import { PipelineContext, RecCandidate } from '@/types/recommendation.types';
import { CandidateGenerator } from './candidate-generator.service';
import { HardFilterEngine } from './hard-filter.service';
import { ScoringEngine } from './scoring-engine.service';
import { DiversityEngine } from './diversity-engine.service';
import { FreshnessEngine } from './freshness-engine.service';
import { ExplorationEngine } from './exploration-engine.service';
import { UserProfileEngine } from '../profile.service';

const ALGORITHM_VERSION = 'v1.0.0-neural-core';

export class RecommendationPipeline {
  
  static async getFeed(userId: string, contextOverrides: Partial<PipelineContext> = {}): Promise<RecCandidate[]> {
    const startTime = performance.now();

    try {
      // 1. Build Context
      const tasteProfile = await UserProfileEngine.generateTasteProfile(userId);
      if (!tasteProfile) throw new Error("Failed to load user profile");

      const date = new Date();
      const ctx: PipelineContext = {
        userId,
        tasteProfile,
        timeOfDay: date.getHours() > 22 ? 'late_night' : 'evening',
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        feedType: 'for_you',
        ...contextOverrides
      };

      // 2. The Pipeline Execution
      const candidates = await CandidateGenerator.getCandidates(ctx);
      const sieved = await HardFilterEngine.filter(userId, candidates);
      const scored = ScoringEngine.scoreCandidates(sieved, ctx);
      const decayed = await FreshnessEngine.applyImpressionDecay(userId, scored);
      const diversified = DiversityEngine.applyEntropy(decayed);
      const finalFeed = ExplorationEngine.injectWildcards(diversified, sieved, 20);

      // 3. Telemetry & Analytics
      const latencyMs = Math.round(performance.now() - startTime);
      this.logSession(userId, ctx.feedType, candidates.length, finalFeed.length, latencyMs);
      
      console.log(`[Neural Core] Feed generated in ${latencyMs}ms. Yield: ${finalFeed.length}`);
      return finalFeed;

    } catch (error) {
      console.error("[Neural Core] Pipeline Fatal Error:", error);
      return [];
    }
  }

  /**
   * Silent async logging to avoid blocking the HTTP response.
   */
  private static logSession(userId: string, feedType: string, candCount: number, retCount: number, latency: number) {
    supabaseAdmin.from('recommendation_logs').insert({
      user_id: userId,
      feed_type: feedType,
      algorithm_version: ALGORITHM_VERSION,
      latency_ms: latency,
      candidates_evaluated: candCount,
      returned_count: retCount
    }).then(({ error }) => {
      if (error) console.error("Session Log Error:", error);
    });
  }
}