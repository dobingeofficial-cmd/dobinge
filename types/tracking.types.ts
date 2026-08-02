/**
 * DOBINGE NEURAL CORE: GLOBAL EVENT TAXONOMY
 * Defines the strict string literals and payload mappings for all telemetry.
 */

export type EventType =
  | 'ONBOARDING_START'
  | 'ONBOARDING_SKIP'
  | 'ONBOARDING_COMPLETE'
  | 'MOOD_SELECT'
  | 'SEARCH_QUERY'
  | 'MEDIA_CLICK'
  | 'AUTH_GUEST_ENTRY'
  | 'AUTH_SIGNUP'
  | 'AUTH_SIGNIN'
  | 'TAB_SWITCH'
  | 'FEED_IMPRESSION'
  | 'SEARCH_CLICK'
  | 'SWIPE_WATCHED'
  | 'SWIPE_REJECT'
  | 'SWIPE_VAULT'
  | 'DOUBLE_TAP_LIKE'
  | 'MEDIA_VIEW_DETAILS'
  | 'TRAILER_PLAY'
  | 'PLATFORM_OUTCLICK'
  | 'WILDCARD_TRIGGER'
  | 'AI_PITCH_READ';

export interface EventDataMap {
  ONBOARDING_START: { source: string; referrer?: string };
  ONBOARDING_SKIP: { step_skipped: string };
  ONBOARDING_COMPLETE: { time_spent_ms: number; total_selections_made?: number };
  
  MOOD_SELECT: { mood_id: string; category?: 'mood' | 'genre' };
  SEARCH_QUERY: { query_string: string; result_count?: number };
  MEDIA_CLICK: { mediaId: number; mediaType: 'movie' | 'tv'; source: string };
  
  AUTH_GUEST_ENTRY: { client_id: string };
  AUTH_SIGNUP: { method: 'email' | 'google' };
  AUTH_SIGNIN: { method: 'email' | 'google' };
  
  TAB_SWITCH: { destination_tab: string; origin_tab?: string };
  FEED_IMPRESSION: { media_ids: number[]; feed_type?: string };
  SEARCH_CLICK: { media_id: number; media_type: string; rank_position?: number };
  
  SWIPE_WATCHED: { media_id: number; media_type: string; confidence_score?: number };
  SWIPE_REJECT: { media_id: number; media_type: string };
  SWIPE_VAULT: { media_id: number; media_type: string };
  DOUBLE_TAP_LIKE: { media_id: number; media_type: string };
  
  MEDIA_VIEW_DETAILS: { media_id: number; media_type: string; source: string };
  TRAILER_PLAY: { media_id: number; duration_watched_ms?: number };
  PLATFORM_OUTCLICK: { media_id: number; platform_id: number };
  WILDCARD_TRIGGER: { media_id: number; ai_match_score?: number };
  AI_PITCH_READ: { media_id: number };
}

export type EventData<T extends EventType> = EventDataMap[T];

export interface TrackingContext {
  currentRoute: string;
  activeMood: string | null;
  activeTab: string | null;
}

export interface TrackingEvent<T extends EventType = EventType> {
  id: string;          
  type: T;             
  data: EventData<T>;  
  context: TrackingContext; 
  timestamp: number;   
}

export interface SessionInfo {
  sessionId: string;
  userAgent?: string;
  viewport?: string;
  startTime: number;
}

export interface TrackingBatch {
  userId: string | null;
  session: SessionInfo;
  events: TrackingEvent[];
  sentAt: number;
}

export interface TrackingResponse {
  success: boolean;
  processedCount: number;
  error?: string;
}

export interface TrackingOptions {
  batchSizeThreshold: number;
  flushIntervalMs: number;
  enabled: boolean;
  debug: boolean;
}