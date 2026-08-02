import { ExplanationRequest } from '@/types/explanation.types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export class ExplanationBuilder {
  /**
   * Calls Gemini 1.5 Flash to transform factual match data into punchy, humanized prose.
   */
  static async humanizeWithAi(req: ExplanationRequest): Promise<{ short: string; medium: string } | null> {
    if (!GEMINI_API_KEY) return null;

    const matchedGenres = req.enrichment.genres.filter(
      g => (req.tasteProfile.genres?.[g] || 0) > 0
    );

    const prompt = `
You are the voice of DoBinge, an ultra-exclusive, slick cinematic platform.
Your task is to write a brief, elegant explanation for why the title "${req.title}" was recommended to a user.

FACTUAL DATA MATCH:
- Matched Genres: ${matchedGenres.join(', ') || req.enrichment.genres.join(', ')}
- Pacing: ${req.enrichment.pacing}
- Key Themes: ${req.enrichment.themes.join(', ')}
- Active Mood Context: ${req.activeMood || 'None'}

STRICT RULES:
1. Do NOT mention internal scores, percentages, weights, or vector algorithms.
2. Do NOT invent plots, actors, or details not present in the data.
3. Keep it conversational, cinematic, and authoritative.
4. Output MUST be valid minified JSON with exactly two keys: "short" (1 sentence) and "medium" (2-3 sentences).

Example Format:
{"short":"...", "medium":"..."}
`;

    try {
      // Fast timeout to prevent lagging the client
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000); // 2 second max budget

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      clearTimeout(timeout);

      if (!response.ok) return null;

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      const parsed = JSON.parse(rawText);
      if (parsed.short && parsed.medium) {
        return { short: parsed.short.trim(), medium: parsed.medium.trim() };
      }
      return null;
    } catch {
      return null; // Graceful fallback on abort or network error
    }
  }
}