import { supabaseAdmin } from '@/lib/supabase/admin';
import { TasteProfile, RawEventRecord } from '@/types/profile.types';

export class UserProfileEngine {
  // ── 🧠 1. THE WEIGHTING MATRIX ──
  // Defines the gravitational pull of every possible user action.
  private static readonly EVENT_WEIGHTS: Record<string, number> = {
    'DOUBLE_TAP_LIKE': 10.0,
    'SWIPE_WATCHED': 8.0,
    'SWIPE_VAULT': 5.0,
    'MOOD_SELECT': 4.0,     // High explicit intent
    'TRAILER_PLAY': 3.0,
    'MEDIA_CLICK': 1.0,
    'MEDIA_VIEW_DETAILS': 1.0,
    'SEARCH_CLICK': 2.0,
    'SWIPE_REJECT': -8.0,   // Strong repelling force
  };

  // ── ⏳ 2. THE TIME DECAY ALGORITHM ──
  // Half-life equation: Interests fade over time unless reinforced.
  // A swipe from today is worth 100%. A swipe from 30 days ago is worth 50%.
  private static calculateTimeDecay(timestampStr: string, halfLifeDays: number = 30): number {
    const eventDate = new Date(timestampStr).getTime();
    const daysOld = (Date.now() - eventDate) / (1000 * 60 * 60 * 24);
    
    if (daysOld < 0) return 1.0; 
    
    // Formula: (0.5) ^ (time / half-life)
    return Math.pow(0.5, daysOld / halfLifeDays);
  }

  // ── 🏗️ 3. THE PROFILE BUILDER ──
  public static async generateTasteProfile(userId: string): Promise<TasteProfile | null> {
    try {
      console.log(`[Neural Core] Aggregating profile for user: ${userId}`);

      // 1. Fetch historical persistent interactions (The Foundation)
      const { data: interactions, error: interactionsError } = await supabaseAdmin
        .from('interactions')
        .select('interaction_type, media_id, created_at')
        .eq('user_id', userId);

      // 2. Fetch recent ephemeral telemetry (The Nuance)
      const { data: telemetry, error: telemetryError } = await supabaseAdmin
        .from('telemetry_logs')
        .select('event_type, event_data, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()); // Last 90 days

      if (interactionsError || telemetryError) throw new Error("Failed to fetch user history");

      // 3. Normalize into a single chronological timeline
      const timeline: RawEventRecord[] = [
        ...(interactions || []).map(i => ({ type: i.interaction_type, created_at: i.created_at, media_id: i.media_id })),
        ...(telemetry || []).map(t => ({ type: t.event_type, created_at: t.created_at, data: t.event_data }))
      ];

      // 4. Initialize empty multi-dimensional profile
      const profile: TasteProfile = {
        genres: {}, moods: {}, themes: {}, pacing: {}, tone: {}, runtime: {}, decades: {}, countries: {}
      };

      // 5. Process the Timeline
      for (const event of timeline) {
        const baseWeight = this.EVENT_WEIGHTS[event.type] || 0;
        if (baseWeight === 0) continue;

        // Apply fading/emerging interest mathematics
        const decayedWeight = baseWeight * this.calculateTimeDecay(event.created_at, 30);

        // Explicit Mood Selections
        if (event.type === 'MOOD_SELECT' && event.data?.mood_id) {
          this.applyWeight(profile.moods, event.data.mood_id, decayedWeight);
          continue;
        }

        // Media-based actions (requires mapping mediaId to its hidden dimensions)
        const mediaId = event.media_id || event.data?.mediaId;
        if (mediaId) {
          // ⚠️ ARCHITECTURE NOTE: In Phase 4, this stub will be replaced by our Media Metadata Cache.
          // For now, it represents how the engine shatters a single movie into multiple dimensions.
          const movieDNA = await this.mockGetMediaDNA(mediaId);
          
          movieDNA.genres.forEach(g => this.applyWeight(profile.genres, g, decayedWeight));
          movieDNA.pacing.forEach(p => this.applyWeight(profile.pacing, p, decayedWeight));
          movieDNA.tone.forEach(t => this.applyWeight(profile.tone, t, decayedWeight));
          if (movieDNA.decade) this.applyWeight(profile.decades, movieDNA.decade, decayedWeight);
        }
      }

      // 6. Save the computed profile back to the database
      await supabaseAdmin
        .from('user_preferences')
        .upsert({
          user_id: userId,
          taste_profile: profile,
          profile_updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      console.log(`[Neural Core] Profile baked and cached for ${userId}`);
      return profile;

    } catch (error) {
      console.error("[Neural Core] Profile Generation Fault:", error);
      return null;
    }
  }

  // ── 🔧 4. HELPER UTILITIES ──

  // Safely adds a score to a dimension, clamping extremes
  private static applyWeight(dimension: Record<string, number>, trait: string, weight: number) {
    if (!dimension[trait]) dimension[trait] = 0;
    dimension[trait] += weight;
    // Format to 2 decimal places to keep JSON size small
    dimension[trait] = Math.round(dimension[trait] * 100) / 100;
  }

  // MOCK: Transforms a single movie ID into its base properties.
  // This decoupling means the Profile Engine doesn't care *how* we get movie data.
  private static async mockGetMediaDNA(mediaId: number) {
    // In production, this hits Redis or our local Supabase `movies_metadata` table.
    return {
      genres: ['Sci-Fi', 'Thriller'],
      pacing: ['Slow-Burn'],
      tone: ['Dark', 'Philosophical'],
      decade: '2010s'
    };
  }
}