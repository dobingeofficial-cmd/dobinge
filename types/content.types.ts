/**
 * DOBINGE NEURAL CORE: CONTENT INTELLIGENCE TYPES
 */

export interface ContentEnrichment {
  genres: string[];        // e.g., ["Sci-Fi", "Cyberpunk"]
  themes: string[];        // e.g., ["AI Rebellion", "Isolation", "Corporate Greed"]
  mood: string[];          // e.g., ["Atmospheric", "Bleak", "Philosophical"]
  pacing: 'Frenetic' | 'Fast' | 'Steady' | 'Slow-Burn' | 'Meditative';
  tone: string[];          // e.g., ["Dark", "Cynical"]
  energy_level: number;    // 1-100 (1 = Sleepy, 100 = Adrenaline)
  story_complexity: number;// 1-100 (1 = Turn brain off, 100 = Requires notepad)
  emotional_intensity: number; // 1-100 (Tearjerker/Anxiety vs Breezy)
  mind_bending_score: number;  // 1-100 (Plot twists, confusing timelines)
  comfort_watch_score: number; // 1-100 (Familiar, safe, rewatchable)
  situational_tags: string[];  // e.g., ["Late Night Watch", "Rainy Day", "Don't watch with parents"]
  ai_pitch: string;        // A 1-sentence edgy, humanized pitch for the UI
}

export interface ContentIntelligenceRecord {
  media_id: number;
  media_type: 'movie' | 'tv' | 'anime';
  tmdb_metadata: any;
  ai_enrichment: ContentEnrichment;
  ai_model_version: string;
  updated_at: string;
}