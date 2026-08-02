"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useTracker } from '@/hooks/useTracker';

/**
 * Tracks the macro lifecycle of the onboarding flow.
 */
export function useOnboardingLifecycle() {
  const { track } = useTracker();
  
  // useRef guarantees this event fires EXACTLY once, even if React strict mode double-mounts
  const hasTrackedStart = useRef(false);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    if (!hasTrackedStart.current) {
      track('ONBOARDING_START', { source: 'organic' }, { currentRoute: '/discovery' });
      hasTrackedStart.current = true;
    }
  }, [track]);

  const trackSkip = useCallback((stepName: string) => {
    track('ONBOARDING_SKIP', { step_skipped: stepName }, { currentRoute: `/discovery/${stepName}` });
  }, [track]);

  const trackComplete = useCallback((totalSelections: number = 0) => {
    const timeSpentMs = Date.now() - mountTime.current;
    track('ONBOARDING_COMPLETE', { time_spent_ms: timeSpentMs, total_selections_made: totalSelections }, { currentRoute: '/home' });
  }, [track]);

  return { trackSkip, trackComplete };
}

/**
 * Tracks micro-interactions during the discovery process.
 */
export function useDiscoveryInteractions() {
  const { track } = useTracker();

  const trackMoodSelect = useCallback((moodId: string, category: 'mood' | 'genre' = 'mood') => {
    track('MOOD_SELECT', { mood_id: moodId, category });
  }, [track]);

  const trackFavoriteSelect = useCallback((mediaId: number, mediaType: 'movie' | 'tv', category: 'movie' | 'series' | 'anime') => {
    track('MEDIA_CLICK', { mediaId, mediaType, source: `onboarding_favorite_${category}` });
  }, [track]);

  const trackSearch = useCallback((query: string, resultCount: number = 0) => {
    if (!query.trim()) return; // Don't track empty keystrokes
    track('SEARCH_QUERY', { query_string: query, result_count: resultCount });
  }, [track]);

  return { trackMoodSelect, trackFavoriteSelect, trackSearch };
}

/**
 * Tracks authentication conversions.
 */
export function useAuthConversion() {
  const { track } = useTracker();

  const trackGuest = useCallback(() => {
    track('AUTH_GUEST_ENTRY', { client_id: 'local_device' });
  }, [track]);

  const trackAuthSuccess = useCallback((method: 'email' | 'google', isSignUp: boolean) => {
    track(isSignUp ? 'AUTH_SIGNUP' : 'AUTH_SIGNIN', { method });
  }, [track]);

  return { trackGuest, trackAuthSuccess };
}