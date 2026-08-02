import { ExplanationRequest } from '@/types/explanation.types';

export class ExplanationTemplates {
  /**
   * Generates a 100% reliable, zero-latency explanation using string templates.
   * Serves as the primary fallback if AI is slow or unconfigured.
   */
  static generate(req: ExplanationRequest): { short: string; medium: string } {
    const matchedGenres = req.enrichment.genres.filter(
      g => (req.tasteProfile.genres?.[g] || 0) > 0
    );

    const primaryGenre = matchedGenres[0] || req.enrichment.genres[0] || 'cinema';
    const secondaryGenre = matchedGenres[1] || req.enrichment.genres[1] || '';
    const pacing = req.enrichment.pacing || 'steady';
    const primaryTheme = req.enrichment.themes?.[0] || 'compelling storytelling';

    // Short Explanation (1 sentence)
    let short = `Matches your affinity for ${pacing.toLowerCase()} ${primaryGenre} with strong ${primaryTheme}.`;
    if (req.activeMood) {
      short = `Selected for your "${req.activeMood}" mood based on its ${pacing.toLowerCase()} ${primaryGenre} themes.`;
    }

    // Medium Explanation (2-3 sentences)
    const genreStr = secondaryGenre ? `${primaryGenre} and ${secondaryGenre}` : primaryGenre;
    const medium = `Based on your preference for ${genreStr}, "${req.title}" aligns with your taste profile. It features a ${pacing.toLowerCase()} pace focused on ${primaryTheme}. This title was selected to match your viewing patterns without repeating recent picks.`;

    return { short, medium };
  }
}