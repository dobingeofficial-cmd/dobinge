import { supabaseAdmin } from '@/lib/supabase/admin';
import { ParsedSearchIntent } from '@/types/search.types';

export class SearchCache {
  static async getParsedIntent(query: string): Promise<ParsedSearchIntent | null> {
    const queryHash = query.toLowerCase().trim();
    const { data } = await supabaseAdmin
      .from('search_cache')
      .select('parsed_intent')
      .eq('query_hash', queryHash)
      .single();
    
    return data ? (data.parsed_intent as ParsedSearchIntent) : null;
  }

  static async setParsedIntent(query: string, intent: ParsedSearchIntent) {
    const queryHash = query.toLowerCase().trim();
    await supabaseAdmin.from('search_cache').upsert({
      query_hash: queryHash,
      parsed_intent: intent,
      created_at: new Date().toISOString()
    });
  }

  static async logSearch(userId: string | null, query: string) {
    const cleanQuery = query.toLowerCase().trim();
    
    if (userId) {
      await supabaseAdmin.from('saved_searches').insert({ user_id: userId, query: cleanQuery });
    }

    // Increment trending counter (upsert)
    // For ₹0 budget, we trigger an RPC or just let it fail silently if conflict logic is complex, 
    // but a standard upsert works if we pull the current count first, or use a Postgres function.
    // Simplifying for Node.js logic:
    const { data } = await supabaseAdmin.from('search_trending').select('search_count').eq('query', cleanQuery).single();
    const currentCount = data ? data.search_count : 0;
    
    await supabaseAdmin.from('search_trending').upsert({
      query: cleanQuery,
      search_count: currentCount + 1,
      last_searched_at: new Date().toISOString()
    });
  }
}
