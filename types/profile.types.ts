/**
 * DOBINGE NEURAL CORE: TASTE PROFILE TYPES
 * Represents the mathematical output of a user's behavior.
 */

export interface TasteDimensionScores {
  [trait: string]: number; // e.g., "Sci-Fi": 45.2, "Slow-Burn": 12.1, "Horror": -5.4
}

export interface TasteProfile {
  genres: TasteDimensionScores;
  moods: TasteDimensionScores;
  themes: TasteDimensionScores;
  pacing: TasteDimensionScores;
  tone: TasteDimensionScores;
  runtime: TasteDimensionScores;
  decades: TasteDimensionScores;
  countries: TasteDimensionScores;
  // Infinitely scalable: Allows adding new dimensions without refactoring
  [customDimension: string]: TasteDimensionScores; 
}

export interface RawEventRecord {
  type: string;
  created_at: string;
  data?: any;
  media_id?: number;
}