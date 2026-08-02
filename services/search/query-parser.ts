import { ParsedSearchIntent } from '@/types/search.types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export class QueryParser {
  /**
   * Transforms raw natural language into a strict JSON filter object.
   * NEVER returns movie recommendations directly.
   */
  static async parseIntent(rawQuery: string): Promise<ParsedSearchIntent> {
    if (!GEMINI_API_KEY) return this.fallbackParser(rawQuery);

    const prompt = `
You are a Search Intent Parser for DoBinge.
Analyze the user's search query and extract their viewing intent into strict JSON.
DO NOT recommend movies. ONLY extract filters.

User Query: "${rawQuery}"

Rules for output JSON:
- intentType: "exact" (looking for a specific title/person), "semantic" (describing themes), or "mood" (describing feelings/events).
- title: string (if exact)
- genres: array of strings
- excludedGenres: array of strings
- moods: array of strings (e.g., "Comfort", "Scary", "Date Night")
- runtimeMax: integer (minutes)
- intensity: "low", "medium", "high"
- mediaType: "movie", "tv", "anime", or "any"

Output ONLY valid JSON. No markdown formatting.
`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.0, responseMimeType: 'application/json' }
          })
        }
      );

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) return this.fallbackParser(rawQuery);
      return JSON.parse(rawText) as ParsedSearchIntent;

    } catch (error) {
      console.error("[Search Engine] AI Parsing Failed:", error);
      return this.fallbackParser(rawQuery);
    }
  }

  // Blazing fast regex fallback if AI is down
  private static fallbackParser(query: string): ParsedSearchIntent {
    return {
      intentType: 'exact',
      title: query.trim(),
      mediaType: 'any'
    };
  }
}