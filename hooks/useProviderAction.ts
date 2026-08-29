import { useState, useCallback } from 'react';
import { NormalizedProvider, WatchProviderResponse } from '@/types/providers';
import { useRegion } from '@/hooks/useRegion';

const providerCache = new Map<string, WatchProviderResponse>();

// Pre-mapped Search Queries for Tier-1 Platforms (Bypasses TMDB completely)
const generateDeepLink = (providerId: number, title: string): string | null => {
  if (!title) return null;
  const q = encodeURIComponent(title);
  
  const providerMap: Record<number, string> = {
    8: `https://www.netflix.com/search?q=${q}`,             // Netflix
    119: `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}`, // Prime Video
    337: `https://www.disneyplus.com/search?q=${q}`,        // Disney+
    122: `https://www.hotstar.com/in/explore?search_query=${q}`, // Hotstar
    350: `https://tv.apple.com/search?term=${q}`,           // Apple TV+
    1883: `https://www.max.com/search?q=${q}`,              // Max
    15: `https://www.hulu.com/search?q=${q}`,               // Hulu
    283: `https://www.crunchyroll.com/search?q=${q}`,       // Crunchyroll
    531: `https://www.paramountplus.com/search?q=${q}`,     // Paramount+
    384: `https://www.peacocktv.com/search?q=${q}`,         // Peacock
    220: `https://www.jiocinema.com/search?q=${q}`,         // JioCinema
    232: `https://www.zee5.com/search?q=${q}`               // Zee5
  };

  return providerMap[providerId] || null;
};

export function useProviderAction() {
  const { countryCode, isRegionResolved } = useRegion();
  const [isLoading, setIsLoading] = useState(false);
  const [isResolvingLink, setIsResolvingLink] = useState(false);
  const [providers, setProviders] = useState<NormalizedProvider[]>([]);
  const [justWatchLink, setJustWatchLink] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>('');
  const [showSelector, setShowSelector] = useState(false);

  // Added `mediaTitle` to capture the search term for deep-linking
  const resolveAction = useCallback(async (mediaId: number | string, mediaType: 'movie' | 'tv', mediaTitle: string) => {
    if (!mediaId || !mediaType || !isRegionResolved) return;
    
    const activeRegion = countryCode.toUpperCase();
    const cacheKey = `${mediaType}-${mediaId}-${activeRegion}`;
    
    setActiveTitle(mediaTitle || '');

    if (providerCache.has(cacheKey)) {
      handleResolvedData(providerCache.get(cacheKey)!, activeRegion);
      return;
    }

    setIsLoading(true);
    setShowSelector(false);

    try {
      const res = await fetch(`/api/providers?mediaType=${mediaType}&mediaId=${mediaId}&countryCode=${activeRegion}`);
      
      if (!res.ok) throw new Error('Failed to resolve providers from DoBinge API.');

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
    setJustWatchLink(data.link || null);
    setProviders(availableProviders);

    if (availableProviders.length === 0) {
      alert(`No streaming options found in ${activeRegion}.`);
      return;
    }

    setShowSelector(true);
  };

  const handleSelectProvider = useCallback(async (provider: NormalizedProvider) => {
    // Strategy 1: Attempt native platform search deep-link first
    const deepLink = generateDeepLink(provider.provider_id, activeTitle);
    
    if (deepLink) {
      window.open(deepLink, '_blank', 'noopener,noreferrer');
      setShowSelector(false);
      return;
    }

    // Strategy 2: Server-Side Unwrapper Fallback for obscure providers
    if (justWatchLink) {
      setIsResolvingLink(true);
      try {
        const res = await fetch(`/api/unwrap?url=${encodeURIComponent(justWatchLink)}`);
        const data = await res.json();

        if (data.url) {
          window.open(data.url, '_blank', 'noopener,noreferrer');
        } else {
          throw new Error('Unwrap failed');
        }
      } catch (e) {
        alert(`Direct watch link for ${provider.provider_name} is currently unavailable.`);
      } finally {
        setIsResolvingLink(false);
        setShowSelector(false);
      }
    } else {
      alert(`Direct watch link for ${provider.provider_name} is currently unavailable.`);
      setShowSelector(false);
    }
  }, [justWatchLink, activeTitle]);

  return {
    isLoading,
    isResolvingLink,
    providers,
    showSelector,
    resolveAction,
    handleSelectProvider,
    setShowSelector
  };
}