export interface ParsedSearchIntent {
  intentType: 'exact' | 'semantic' | 'mood';
  title?: string;               // For exact matches ("Interstellar")
  genres?: string[];            // e.g., ["Horror", "Sci-Fi"]
  excludedGenres?: string[];    // e.g., ["Comedy"]
  moods?: string[];             // e.g., ["Rainy Day", "Comfort"]
  runtimeMax?: number;          // e.g., 120
  intensity?: 'low' | 'medium' | 'high';
  mediaType?: 'movie' | 'tv' | 'anime' | 'any';
  releaseYear?: number;
}

export interface SearchResultCandidate {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  overview: string;
  releaseDate: string;
  matchScore: number;      // 0-100 Base relevance
  personalizedScore: number; // 0-100 After ranking against TasteProfile
}