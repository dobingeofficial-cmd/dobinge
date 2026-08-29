// src/lib/tmdb/providers.ts

import { NormalizedProvider, WatchProviderResponse, ProviderCategory } from '@/types/providers';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function resolveWatchProviders(
  mediaType: 'movie' | 'tv',
  mediaId: number,
  countryCode: string
): Promise<WatchProviderResponse | null> {
  
  if (!TMDB_API_KEY) {
    console.error('DoBinge Backend Fault: TMDB_API_KEY is missing.');
    return null;
  }

  const endpoint = `${TMDB_BASE_URL}/${mediaType}/${mediaId}/watch/providers`;

  try {
    // Next.js App Router native caching. 
    // Revalidates once every 24 hours (86400s) to keep costs at ₹0.
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json',
      },
      next: { revalidate: 86400 } 
    });

    if (!res.ok) {
      console.warn(`TMDB Provider Fetch Failed: HTTP ${res.status} for ${mediaType} ${mediaId}`);
      return null;
    }

    const data = await res.json();
    const results = data.results;

    if (!results || !results[countryCode]) {
      // Graceful fallback: Country has no provider data for this title.
      return { mediaId, mediaType, countryCode, justWatchLink: '', providers: [] };
    }

    const countryData = results[countryCode];
    const providerMap = new Map<number, NormalizedProvider>();

    // Deterministic Normalization: Processes categories in priority order.
    // If a provider offers both 'flatrate' and 'rent', it gets locked in as 'flatrate' to prevent duplicates.
    const addProviders = (items: any[] | undefined, category: ProviderCategory) => {
      if (!items) return;
      items.forEach((item) => {
        if (!providerMap.has(item.provider_id)) {
          providerMap.set(item.provider_id, {
            providerId: item.provider_id,
            providerName: item.provider_name,
            logoPath: item.logo_path,
            providerCategory: category,
            displayPriority: item.display_priority,
          });
        }
      });
    };

    addProviders(countryData.flatrate, 'flatrate');
    addProviders(countryData.free, 'free');
    addProviders(countryData.ads, 'ads');
    addProviders(countryData.buy, 'buy');
    addProviders(countryData.rent, 'rent');

    const sortedProviders = Array.from(providerMap.values()).sort((a, b) => a.displayPriority - b.displayPriority);

    return {
      mediaId,
      mediaType,
      countryCode,
      justWatchLink: countryData.link,
      providers: sortedProviders
    };

  } catch (error) {
    console.error(`DoBinge Provider Resolver Error:`, error);
    return null;
  }
}