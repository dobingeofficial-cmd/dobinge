// src/hooks/useProviderAction.ts

import { useState, useCallback, useRef } from 'react';
import { WatchProviderResponse, NormalizedProvider } from '@/types/providers';

export function useProviderAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [providers, setProviders] = useState<NormalizedProvider[]>([]);
  const [justWatchLink, setJustWatchLink] = useState<string>('');
  const [showSelector, setShowSelector] = useState(false);
  
  // Client-side cache to prevent duplicate requests on rapid double-clicks
  const cacheRef = useRef<Record<string, WatchProviderResponse>>({});

  const resolveAction = useCallback(async (mediaId: number | string, mediaType: 'movie' | 'tv') => {
    if (!mediaId || !mediaType) return;
    
    const cacheKey = `${mediaType}-${mediaId}`;
    if (cacheRef.current[cacheKey]) {
      handleResolvedData(cacheRef.current[cacheKey]);
      return;
    }

    setIsLoading(true);
    setErrorState(null);
    setShowSelector(false);

    try {
      const res = await fetch(`/api/providers?mediaType=${mediaType}&mediaId=${mediaId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resolve providers.');
      }

      cacheRef.current[cacheKey] = data;
      handleResolvedData(data);

    } catch (err: any) {
      console.error('DoBinge Provider Action Error:', err);
      setErrorState('Streaming availability couldn’t be determined for your region.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResolvedData = (data: WatchProviderResponse) => {
    setJustWatchLink(data.justWatchLink);
    const availableProviders = data.providers || [];
    setProviders(availableProviders);

    if (availableProviders.length === 0) {
      setErrorState('No streaming options found in your region.');
      return;
    }

    if (availableProviders.length === 1) {
      // Case A: Exactly one provider -> open immediately
      const targetUrl = data.justWatchLink || '#';
      if (targetUrl !== '#') {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // Case B: Multiple providers -> trigger minimal selector UI
    setShowSelector(true);
  };

  const handleSelectProvider = useCallback((provider: NormalizedProvider, linkOverride?: string) => {
    const destination = linkOverride || justWatchLink;
    if (destination && destination !== '#') {
      window.open(destination, '_blank', 'noopener,noreferrer');
    }
    setShowSelector(false);
  }, [justWatchLink]);

  const resetActionState = useCallback(() => {
    setIsLoading(false);
    setErrorState(null);
    setShowSelector(false);
  }, []);

  return {
    isLoading,
    errorState,
    providers,
    showSelector,
    resolveAction,
    handleSelectProvider,
    resetActionState,
    setShowSelector
  };
}