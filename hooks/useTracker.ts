"use client";

import { useCallback, useSyncExternalStore } from 'react';
import { trackingManager } from '@/lib/tracking/tracking-manager';
import { EventType, EventData, TrackingEvent } from '@/types/tracking.types';

// 1. Stable SSR Reference
const SERVER_SNAPSHOT = { pendingCount: 0, isFlushing: false };

// 2. 🎯 HARD FIX: Client-Side Memory Cache
// This intercepts trackingManager.getState() and prevents it from returning 
// a new object reference unless the actual integer/boolean values have mutated.
let cachedClientState = SERVER_SNAPSHOT;

const getStableSnapshot = () => {
  const rawState = trackingManager.getState();
  
  // Only update the memory reference if the actual values changed
  if (
    rawState.pendingCount !== cachedClientState.pendingCount ||
    rawState.isFlushing !== cachedClientState.isFlushing
  ) {
    cachedClientState = rawState; // Create a new reference ONLY when data mutates
  }
  
  return cachedClientState; // Return the stable reference
};

export function useTracker() {
  // Expose reactive state safely without triggering infinite renders
  const state = useSyncExternalStore(
    (listener) => trackingManager.subscribe(listener),
    getStableSnapshot,     // Feed React the cached interceptor
    () => SERVER_SNAPSHOT  // Feed React the stable SSR fallback
  );

  // Memoize the track function so it never breaks dependency arrays in useEffects
  const track = useCallback(
    <T extends EventType>(
      type: T, 
      data: EventData<T>, 
      contextOverrides?: Partial<TrackingEvent['context']>
    ) => {
      trackingManager.track(type, data, contextOverrides);
    },
    []
  );

  const flush = useCallback(() => {
    trackingManager.flush('MANUAL');
  }, []);

  const clear = useCallback(() => {
    trackingManager.clear();
  }, []);

  return {
    track,
    flush,
    clear,
    pendingCount: state.pendingCount,
    isFlushing: state.isFlushing,
  };
}