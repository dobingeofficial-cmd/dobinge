import { TasteProfile } from './profile.types';
import { ContentEnrichment } from './content.types';

export interface ExplanationRequest {
  userId: string;
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'anime';
  title: string;
  tasteProfile: TasteProfile;
  enrichment: ContentEnrichment;
  activeMood?: string;
  feedType?: string;
}

export interface ExplanationResult {
  shortExplanation: string;  // 1 sentence (Primary UI badge)
  mediumExplanation: string; // 2-3 sentences (Modal / Expanded detail)
  isAiGenerated: boolean;
  cached: boolean;
  engineVersion: string;
}