import { supabaseAdmin } from '@/lib/supabase/admin';
import { ExplanationResult } from '@/types/explanation.types';

export class ExplanationCache {
  static async get(
    userId: string, 
    mediaId: number, 
    mediaType: string, 
    version: string
  ): Promise<ExplanationResult | null> {
    try {
      const { data } = await supabaseAdmin
        .from('cached_explanations')
        .select('short_explanation, medium_explanation, engine_version')
        .eq('user_id', userId)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)
        .single();

      if (data && data.engine_version === version) {
        return {
          shortExplanation: data.short_explanation,
          mediumExplanation: data.medium_explanation,
          isAiGenerated: true,
          cached: true,
          engineVersion: data.engine_version
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  static async set(
    userId: string,
    mediaId: number,
    mediaType: string,
    short: string,
    medium: string,
    version: string
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('cached_explanations')
        .upsert({
          user_id: userId,
          media_id: mediaId,
          media_type: mediaType,
          short_explanation: short,
          medium_explanation: medium,
          engine_version: version,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id, media_id, media_type' });
    } catch (error) {
      console.error('[Neural Core] Explanation Cache Set Fault:', error);
    }
  }
}