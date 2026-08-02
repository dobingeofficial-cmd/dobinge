import { ParsedSearchIntent, SearchResultCandidate } from '@/types/search.types';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export class SemanticSearchFetcher {
  /**
   * Bridges the AI's parsed intent to TMDB's discovery and search endpoints.
   */
  static async fetchCandidates(intent: ParsedSearchIntent): Promise<SearchResultCandidate[]> {
    let url = '';

    if (intent.intentType === 'exact' && intent.title) {
      // Standard Exact Search
      url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(intent.title)}&page=1`;
    } else {
      // Semantic / Mood Search Mapping
      // In production, you would map string genres to TMDB genre IDs here.
      // For this implementation, we use TMDB keyword search as a proxy for themes/moods.
      const queryParam = [...(intent.genres || []), ...(intent.moods || [])].join(' ');
      url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(queryParam)}&page=1`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("TMDB Search Failed");
      
      const data = await res.json();
      
      return (data.results || [])
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => ({
          mediaId: item.id,
          mediaType: item.media_type,
          title: item.title || item.name,
          posterPath: item.poster_path,
          overview: item.overview,
          releaseDate: item.release_date || item.first_air_date,
          matchScore: item.popularity || 50, // Baseline relevance
          personalizedScore: 0
        }));
    } catch (error) {
      console.error("[Search Engine] Fetch Error:", error);
      return [];
    }
  }
}