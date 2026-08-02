import { SearchResultCandidate } from '@/types/search.types';
import { UserProfileEngine } from '../profile.service';

export class SearchRanking {
  /**
   * Re-ranks standard search results against the user's unique TasteProfile.
   */
  static async personalizeResults(userId: string | null, results: SearchResultCandidate[]): Promise<SearchResultCandidate[]> {
    if (!userId || results.length === 0) {
      // If guest, sort by baseline TMDB popularity
      return results.sort((a, b) => b.matchScore - a.matchScore);
    }

    const tasteProfile = await UserProfileEngine.generateTasteProfile(userId);
    if (!tasteProfile) return results;

    return results.map(item => {
      let personalizationBoost = 0;
      
      // In a full implementation, we'd cross-reference item.mediaId with our ContentIntelligence.
      // For this proxy, we extract keywords from the overview to match against TasteProfile themes/genres.
      const overviewLower = item.overview.toLowerCase();
      
      Object.keys(tasteProfile.genres || {}).forEach(genre => {
        if (overviewLower.includes(genre.toLowerCase())) {
          personalizationBoost += (tasteProfile.genres[genre] * 2); 
        }
      });

      // Cap the boost
      personalizationBoost = Math.min(personalizationBoost, 40);

      item.personalizedScore = item.matchScore + personalizationBoost;
      return item;
    }).sort((a, b) => b.personalizedScore - a.personalizedScore);
  }
}