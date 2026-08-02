import { ParsedSearchIntent, SearchResultCandidate } from '@/types/search.types';
import { QueryParser } from './query-parser';
import { SemanticSearchFetcher } from './semantic-search';
import { SearchCache } from './search-cache';
import { SearchRanking } from './search-ranking';

export class SearchService {
  /**
   * Main entry point for the Search API Route.
   * Pipeline: Log -> Cache Check -> AI Parse -> TMDB Fetch -> Personalize Ranking
   */
  static async executeSearch(query: string, userId: string | null): Promise<SearchResultCandidate[]> {
    const startTime = performance.now();
    console.log(`[Neural Search] Processing: "${query}"`);

    // 1. Log analytics
    await SearchCache.logSearch(userId, query);

    // 2. Check Intent Cache
    let intent = await SearchCache.getParsedIntent(query);

    // 3. AI Parsing (if cache miss)
    if (!intent) {
      intent = await QueryParser.parseIntent(query);
      await SearchCache.setParsedIntent(query, intent);
      console.log(`[Neural Search] Parsed Intent:`, intent.intentType);
    }

    // 4. Fetch Candidates
    const rawResults = await SemanticSearchFetcher.fetchCandidates(intent);

    // 5. Personalize & Rank
    const rankedResults = await SearchRanking.personalizeResults(userId, rawResults);

    console.log(`[Neural Search] Completed in ${Math.round(performance.now() - startTime)}ms. Yield: ${rankedResults.length}`);
    return rankedResults;
  }
}