import { TasteProfile } from './profile.types';
import { ContentEnrichment } from './content.types';

export interface RecCandidate {
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'anime';
  tmdbData: any; // Basic TMDB metadata (poster, title)
  enrichment: ContentEnrichment; // AI data from Phase 4
  
  // Pipeline mutable states
  baseScore: number;
  finalScore: number;
  isWildcard?: boolean;
  confidenceScore: number;
  penaltiesApplied: string[];
}

export interface PipelineContext {
  userId: string;
  tasteProfile: TasteProfile;
  activeMood?: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late_night';
  isWeekend: boolean;
  feedType: 'for_you' | 'mood' | 'hidden_gems';
}

export interface ScoringWeights {
  taste: number;
  mood: number;
  context: number;
  quality: number;
}