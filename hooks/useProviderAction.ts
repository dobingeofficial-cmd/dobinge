import { useState, useCallback } from 'react';
import { NormalizedProvider } from '@/types/providers';
import { useRegion } from '@/hooks/useRegion';

// Global cache ensuring IN and US queries for the same movie are stored separately
const providerCache = new Map<string, any>();

export function useProviderAction() {
  const { countryCode, isRegionResolved } = useRegion();
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<NormalizedProvider[]>([]);
  const [justWatchLink, setJustWatchLink] = useState<string>('');
  const [showSelector, setShowSelector] = useState(false);

  const resolveAction = useCallback(async (mediaId: number | string, mediaType: 'movie' | 'tv') => {
    if (!mediaId || !mediaType || !isRegionResolved) return;
    
    const activeRegion = countryCode.toUpperCase();
    const cacheKey = `${mediaType}-${mediaId}-${activeRegion}`;
    
    if (providerCache.has(cacheKey)) {
      handleResolvedData(providerCache.get(cacheKey)!, activeRegion);
      return;
    }

    setIsLoading(true);
    setShowSelector(false);

    try {
      // Approach A: Strict internal API call with explicit country code
      const res = await fetch(`/api/providers?mediaType=${mediaType}&mediaId=${mediaId}&countryCode=${activeRegion}`);
      
      if (!res.ok) {
        throw new Error('Failed to resolve providers from DoBinge API.');
      }

      const data = await res.json();
      providerCache.set(cacheKey, data);
      handleResolvedData(data, activeRegion);

    } catch (err: any) {
      console.error('DoBinge Provider Action Error:', err);
      alert(`Streaming availability couldn't be determined for ${activeRegion} right now.`);
    } finally {
      setIsLoading(false);
    }
  }, [countryCode, isRegionResolved]);

  const handleResolvedData = (data: any, activeRegion: string) => {
    // If the backend returns our empty state payload
    if (!data || data.providers?.length === 0 && !data.link && !data.flatrate) {
      alert(`No streaming options found in ${activeRegion}.`);
      return;
    }

    const masterLink = data.link || '';
    setJustWatchLink(masterLink);

    // Combine all arrays returned by the normalized backend
    const rawProviders = [
      ...(data.flatrate || []),
      ...(data.rent || []),
      ...(data.buy || []),
      ...(data.ads || [])
    ];

    // Remove duplicates based on provider_id
    const uniqueProvidersMap = new Map<number, NormalizedProvider>();
    rawProviders.forEach((p: any) => {
      if (!uniqueProvidersMap.has(p.provider_id)) {
        uniqueProvidersMap.set(p.provider_id, {
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          logo_path: p.logo_path
        } as any);
      }
    });

    const availableProviders = Array.from(uniqueProvidersMap.values());
    setProviders(availableProviders);

    // Routing Logic based on exactly what is available in the selected region
    if (availableProviders.length === 0) {
      if (masterLink) {
        window.open(masterLink, '_blank', 'noopener,noreferrer');
      } else {
        alert(`No streaming options found in ${activeRegion}.`);
      }
      return;
    }

    if (availableProviders.length === 1) {
      if (masterLink) {
        window.open(masterLink, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    setShowSelector(true);
  };

  const handleSelectProvider = useCallback((provider: NormalizedProvider, linkOverride?: string) => {
    // Future expansion point: If provider contains an affiliateDestinationUrl, use it here.
    const destination = linkOverride || justWatchLink;
    if (destination && destination !== '#') {
      window.open(destination, '_blank', 'noopener,noreferrer');
    }
    setShowSelector(false);
  }, [justWatchLink]);

  return {
    isLoading,
    providers,
    showSelector,
    resolveAction,
    handleSelectProvider,
    setShowSelector
  };
}