import { supabaseAdmin } from '@/lib/supabase/admin';

export class AutocompleteEngine {
  static async getSuggestions(query: string, userId: string | null): Promise<string[]> {
    const cleanQuery = query.toLowerCase().trim();
    if (cleanQuery.length < 2) return [];

    // 1. Fetch Trending matching prefix
    const { data: trending } = await supabaseAdmin
      .from('search_trending')
      .select('query')
      .ilike('query', `${cleanQuery}%`)
      .order('search_count', { ascending: false })
      .limit(3);

    // 2. Fetch User Recent History matching prefix
    let recent: any[] = [];
    if (userId) {
      const { data } = await supabaseAdmin
        .from('saved_searches')
        .select('query')
        .eq('user_id', userId)
        .ilike('query', `${cleanQuery}%`)
        .order('created_at', { ascending: false })
        .limit(2);
      recent = data || [];
    }

    // Combine, deduplicate, and format
    const suggestions = new Set([
      ...(recent.map(r => r.query)),
      ...(trending?.map(t => t.query) || [])
    ]);

    return Array.from(suggestions);
  }
}