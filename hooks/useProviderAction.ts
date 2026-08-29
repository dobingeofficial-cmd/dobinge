// src/hooks/useProviderAction.ts

import { useState, useCallback } from 'react';
import { NormalizedProvider } from '@/types/providers'; 

// Global cache outside the hook to persist across component unmounts/remounts
const providerCache = new Map<string, any>();

export function useProviderAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<NormalizedProvider[]>([]);
  const [justWatchLink, setJustWatchLink] = useState<string>('');
  const [showSelector, setShowSelector] = useState(false);

  const resolveAction = useCallback(async (mediaId: number | string, mediaType: 'movie' | 'tv') => {
    if (!mediaId || !mediaType) return;
    
    const cacheKey = `${mediaType}-${mediaId}`;
    if (providerCache.has(cacheKey)) {
      handleResolvedData(providerCache.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    setShowSelector(false);

    try {
      const proxyUrl = process.env.NEXT_PUBLIC_TMDB_PROXY_URL || "";
      
      // Fetch directly from the TMDB proxy, bypassing the need for a custom local API route
      const res = await fetch(`${proxyUrl}/api/${mediaType}/${mediaId}/watch/providers`);
      
      if (!res.ok) {
        throw new Error('Failed to resolve providers from TMDB proxy.');
      }

      const data = await res.json();
      providerCache.set(cacheKey, data);
      handleResolvedData(data);

    } catch (err: any) {
      console.error('DoBinge Provider Action Error:', err);
      // Added visible feedback instead of silent failure
      alert('Streaming availability couldn’t be determined for your region right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResolvedData = (data: any) => {
    const results = data.results || {};
    
    // TMDB Region Priority: India -> US -> First Available Global Region
    const regionData = results.IN || results.US || Object.values(results)[0];

    if (!regionData) {
      alert('No streaming options found for this title globally.');
      return;
    }

    const link = regionData.link || '';
    setJustWatchLink(link);

    // Normalize TMDB data: Combine flatrate, rent, buy, ads into a single array
    const rawProviders = [
      ...(regionData.flatrate || []),
      ...(regionData.rent || []),
      ...(regionData.buy || []),
      ...(regionData.ads || [])
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

    // SCENARIO 1: No specific providers, but we have a JustWatch master link
    if (availableProviders.length === 0) {
      if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        alert('No streaming options found in your region.');
      }
      return;
    }

    // SCENARIO 2: Exactly 1 provider, route directly to save a click
    if (availableProviders.length === 1) {
      if (link) window.open(link, '_blank', 'noopener,noreferrer');
      return;
    }

    // SCENARIO 3: Multiple providers exist, trigger the UI selector
    setShowSelector(true);
  };

  const handleSelectProvider = useCallback((provider: NormalizedProvider, linkOverride?: string) => {
    // TMDB's free tier only gives the master JustWatch link, not direct deep links per provider.
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