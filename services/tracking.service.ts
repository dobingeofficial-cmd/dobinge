import { supabaseAdmin } from '@/lib/supabase/admin';
import { TrackingBatch, TrackingResponse, TrackingEvent } from '@/types/tracking.types';

export class TrackingService {
  private static readonly ALLOWED_EVENTS = new Set([
    'MEDIA_CLICK', 'MOOD_SELECT', 'TAB_SWITCH', 'TRAILER_PLAY', 
    'PLATFORM_SELECT', 'SWIPE_RIGHT', 'SWIPE_LEFT', 'SWIPE_DOWN', 
    'DOUBLE_TAP', 'SEARCH_QUERY'
  ]);

  // 🚨 FIX 2: Strict UUID Validation Regex
  private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private static isValidEvent(event: any): event is TrackingEvent {
    if (!event || typeof event !== 'object') return false;
    
    // Enforce strict UUID format to prevent Postgres 22P02 transaction crashes
    if (typeof event.id !== 'string' || !this.UUID_REGEX.test(event.id)) return false;
    
    if (!this.ALLOWED_EVENTS.has(event.type)) return false;
    if (!event.data || typeof event.data !== 'object') return false;
    if (!event.context || typeof event.context !== 'object') return false;
    if (typeof event.timestamp !== 'number') return false;
    
    return true;
  }

  static async processBatch(
    batch: TrackingBatch, 
    serverVerifiedUserId: string | null
  ): Promise<TrackingResponse> {
    try {
      if (!batch.session || !batch.session.sessionId) {
        return { success: false, processedCount: 0, error: "Invalid session metadata." };
      }

      const validEvents = (batch.events || []).filter(this.isValidEvent.bind(this));
      
      if (validEvents.length === 0) {
        return { success: true, processedCount: 0 }; 
      }

      const payload = validEvents.map(event => ({
        id: event.id,
        user_id: serverVerifiedUserId, 
        session_id: batch.session.sessionId,
        event_type: event.type,
        event_data: { 
          ...event.data, 
          _context: event.context, 
          _client_time: event.timestamp 
        },
        created_at: new Date().toISOString() 
      }));

      const { error } = await supabaseAdmin
        .from('telemetry_logs')
        .upsert(payload, { onConflict: 'id', ignoreDuplicates: true });

      if (error) {
        console.error("TrackingService DB Insertion Fault:", error.message);
        return { success: false, processedCount: 0, error: "Database transaction failed." };
      }

      return { success: true, processedCount: validEvents.length };

    } catch (error: any) {
      console.error("TrackingService Fatal Error:", error);
      return { success: false, processedCount: 0, error: "Internal server error." };
    }
  }
}