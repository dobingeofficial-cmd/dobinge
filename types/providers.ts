// src/types/providers.ts

export type ProviderCategory = 'flatrate' | 'free' | 'ads' | 'buy' | 'rent';

export interface NormalizedProvider {
  providerId: number;
  providerName: string;
  logoPath: string; // To be appended to TMDB image base URL client-side
  providerCategory: ProviderCategory; // Highest priority offering (e.g., if on both rent and flatrate, returns flatrate)
  displayPriority: number;
}

export interface WatchProviderResponse {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  countryCode: string; // Verified ISO 3166-1 alpha-2
  justWatchLink: string; // Explicitly named to indicate this is a TMDB/JustWatch landing page, NOT a direct Netflix app link
  providers: NormalizedProvider[];
}