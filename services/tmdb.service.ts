export class TmdbService {
  static async getTrending() {
    // We check for a secure server secret first, falling back to the existing key temporarily during migration
    const apiKey = process.env.TMDB_API_SECRET || process.env.NEXT_PUBLIC_TMDB_API_KEY;
    
    if (!apiKey) {
      throw new Error("Neural Core Error: TMDB API Key missing from environment.");
    }

    // Server-side fetch with Next.js ISR (Incremental Static Regeneration)
    // Caches the response for 3600 seconds (1 hour) at the Edge network
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/all/day?api_key=${apiKey}&language=en-US`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      throw new Error(`TMDB Uplink Failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.results || [];
  }

  static async getDiscoverFeed(mood: string) {
    // Untouched for Milestone 2
    return [];
  }
}