import { NormalizedProvider, WatchProviderResponse } from '@/types/providers';

export function normalizeProviders(tmdbData: any, countryCode: string): WatchProviderResponse {
  // Strict Region Enforcement: No fallbacks to 'US' or 'IN'
  const regionData = tmdbData?.results?.[countryCode.toUpperCase()];

  if (!regionData) {
    return { link: null, providers: [] };
  }

  const rawProviders = [
    ...(regionData.flatrate || []),
    ...(regionData.rent || []),
    ...(regionData.buy || []),
    ...(regionData.ads || [])
  ];

  const uniqueProvidersMap = new Map<number, NormalizedProvider>();

  rawProviders.forEach((p: any) => {
    if (!uniqueProvidersMap.has(p.provider_id)) {
      uniqueProvidersMap.set(p.provider_id, {
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        logo_path: p.logo_path,
        directUrl: null, // Reserved for future direct deep-links
        affiliateUrl: null // Reserved for future JustWatch/Affiliate API
      });
    }
  });

  return {
    link: regionData.link || null,
    providers: Array.from(uniqueProvidersMap.values())
  };
}