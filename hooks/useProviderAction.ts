import { useState, useCallback } from 'react';
import { NormalizedProvider, WatchProviderResponse } from '@/types/providers';
import { useRegion } from '@/hooks/useRegion';

// Global cache ensuring strict isolation by region
const providerCache = new Map<string, WatchProviderResponse>();

export function useProviderAction() {
  const { countryCode, isRegionResolved } = useRegion();
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<NormalizedProvider[]>([]);
  const [justWatchLink, setJustWatchLink] = useState<string | null>(null);
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
      const res = await fetch(`/api/providers?mediaType=${mediaType}&mediaId=${mediaId}&countryCode=${activeRegion}`);
      
      if (!res.ok) {
        throw new Error('Failed to resolve providers from DoBinge API.');
      }

      const data: WatchProviderResponse = await res.json();
      providerCache.set(cacheKey, data);
      handleResolvedData(data, activeRegion);

    } catch (err: any) {
      console.error('DoBinge Provider Action Error:', err);
      alert(`Streaming availability couldn't be determined for ${activeRegion} right now.`);
    } finally {
      setIsLoading(false);
    }
  }, [countryCode, isRegionResolved]);

  const handleResolvedData = (data: WatchProviderResponse, activeRegion: string) => {
    const availableProviders = data.providers || [];
    const masterLink = data.link || null;

    setJustWatchLink(masterLink);
    setProviders(availableProviders);

    if (availableProviders.length === 0) {
      alert(`No streaming options found in ${activeRegion}.`);
      return;
    }

    // Always trigger UI Selector regardless of provider count
    setShowSelector(true);
  };

  const resolveWatchDestination = (provider: NormalizedProvider, fallbackLink: string | null): string | null => {
    if (provider.affiliateUrl) return provider.affiliateUrl;
    if (provider.directUrl) return provider.directUrl;
    if (fallbackLink) return fallbackLink;
    return null;
  };

  const handleSelectProvider = useCallback((provider: NormalizedProvider) => {
    const destinationUrl = resolveWatchDestination(provider, justWatchLink);
    
    if (destinationUrl && destinationUrl !== '#') {
      window.open(destinationUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('A destination link is currently unavailable for this provider.');
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