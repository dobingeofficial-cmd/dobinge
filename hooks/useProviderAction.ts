import { useState, useCallback } from 'react';
import { NormalizedProvider } from '@/types/providers';
import { useRegion } from '@/hooks/useRegion';

const providerCache = new Map<string, any>();

export function useProviderAction() {
  const { countryCode, isRegionResolved } = useRegion();
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<NormalizedProvider[]>([]);
  const [justWatchLink, setJustWatchLink] = useState<string>('');
  const [showSelector, setShowSelector] = useState(false);

  const resolveAction = useCallback(async (mediaId: number | string, mediaType: 'movie' | 'tv') => {
    if (!mediaId || !mediaType || !isRegionResolved) return;
    
    // Strict regional caching
    const cacheKey = `${mediaType}-${mediaId}-${countryCode}`;
    
    if (providerCache.has(cacheKey)) {
      handleResolvedData(providerCache.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    setShowSelector(false);

    try {
      // Pass the specific country code to the backend
      const res = await fetch(`/api/providers?mediaType=${mediaType}&mediaId=${mediaId}&countryCode=${countryCode}`);
      
      if (!res.ok) throw new Error('Failed to resolve providers.');

      const data = await res.json();
      providerCache.set(cacheKey, data);
      handleResolvedData(data);

    } catch (err: any) {
      console.error('DoBinge Provider Action Error:', err);
      // Toast notification recommended here for future UI pass
      alert(`Streaming availability couldn't be determined for ${countryCode}.`);
    } finally {
      setIsLoading(false);
    }
  }, [countryCode, isRegionResolved]);

  const handleResolvedData = (data: any) => {
    // Backend now guarantees 'data' is the specific region object, no fallback logic needed
    if (!data || Object.keys(data).length === 0) {
      alert(`No streaming options found in ${countryCode}.`);
      return;
    }

    const link = data.link || '';
    setJustWatchLink(link);

    const rawProviders = [
      ...(data.flatrate || []),
      ...(data.rent || []),
      ...(data.buy || []),
      ...(data.ads || [])
    ];

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

    // Flow Logic
    if (availableProviders.length === 0) {
      if (link) window.open(link, '_blank', 'noopener,noreferrer');
      else alert(`No streaming options found in ${countryCode}.`);
      return;
    }

    if (availableProviders.length === 1) {
      if (link) window.open(link, '_blank', 'noopener,noreferrer');
      return;
    }

    setShowSelector(true);
  };

  const handleSelectProvider = useCallback((provider: NormalizedProvider, linkOverride?: string) => {
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