import { EventType, EventData, TrackingEvent, TrackingBatch, TrackingOptions, SessionInfo } from '@/types/tracking.types';

// Default ₹0 budget configuration (Optimized for minimal API calls)
const DEFAULT_CONFIG: TrackingOptions = {
  batchSizeThreshold: 10,
  flushIntervalMs: 15000, // 15 seconds
  enabled: true,
  debug: process.env.NODE_ENV === 'development',
};

class TrackingManager {
  private queue: TrackingEvent[] = [];
  private isFlushing = false;
  private config: TrackingOptions;
  private session: SessionInfo;
  private flushTimer: NodeJS.Timeout | null = null;
  private listeners: Set<() => void> = new Set();

  constructor(config = DEFAULT_CONFIG) {
    this.config = config;
    
    // Initialize Session (Only runs on the client)
    this.session = {
      sessionId: typeof crypto !== 'undefined' ? crypto.randomUUID() : `fallback-${Date.now()}`,
      startTime: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'SSR',
    };

    if (typeof window !== 'undefined') {
      this.setupLifecycleListeners();
      this.startTimer();
    }
  }

  private log(...args: any[]) {
    if (this.config.debug) console.log('[Neural Core Tracker]', ...args);
  }

  // Allow React to subscribe to state changes (pending count, etc)
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  public track<T extends EventType>(
    type: T, 
    data: EventData<T>, 
    contextOverrides: Partial<TrackingEvent['context']> = {}
  ) {
    if (!this.config.enabled) return;

    const event: TrackingEvent<T> = {
      id: crypto.randomUUID(),
      type,
      data,
      context: {
        currentRoute: typeof window !== 'undefined' ? window.location.pathname : '/',
        activeMood: null,
        activeTab: null,
        ...contextOverrides,
      },
      timestamp: Date.now(),
    };

    this.queue.push(event);
    this.log(`Event Queued: ${type} | Pending: ${this.queue.length}`);
    this.notify();

    if (this.queue.length >= this.config.batchSizeThreshold) {
      this.flush('THRESHOLD_REACHED');
    }
  }

  public async flush(reason: string = 'MANUAL') {
    if (this.queue.length === 0 || this.isFlushing || !this.config.enabled) return;

    // Offline check: hold data until connection returns
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.log('Offline. Holding batch in memory.');
      return;
    }

    this.isFlushing = true;
    this.notify();

    // Snapshot and clear the queue optimistically
    const batchEvents = [...this.queue];
    this.queue = [];
    
    // If the flush fails, we prepend the failed events back to the new queue
    const revertQueue = () => {
      this.queue = [...batchEvents, ...this.queue];
      this.log('Batch failed. Events returned to queue.');
    };

    try {
      const payload: TrackingBatch = {
        userId: null, // The API route derives this from the HttpOnly JWT/Auth Header
        session: this.session,
        events: batchEvents,
        sentAt: Date.now(),
      };

      this.log(`Flushing ${batchEvents.length} events. Reason: ${reason}`);

      // We use fetch with keepalive: true so the request completes even if the tab closes
      const token = this.getAuthToken();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/tracking/batch', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        keepalive: true, 
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      this.log('Batch uploaded successfully.');
    } catch (error) {
      this.log('Network/API Error:', error);
      revertQueue();
    } finally {
      this.isFlushing = false;
      this.notify();
      this.startTimer(); // Reset the interval timer
    }
  }

  public clear() {
    this.queue = [];
    this.notify();
    this.log('Queue manually cleared.');
  }

  public getState() {
    return {
      pendingCount: this.queue.length,
      isFlushing: this.isFlushing,
    };
  }

  private startTimer() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => {
      this.flush('INTERVAL_TICK');
    }, this.config.flushIntervalMs);
  }

  private setupLifecycleListeners() {
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush('PAGE_UNLOAD');
      }
    });

    window.addEventListener('online', () => {
      this.log('Network restored. Flushing queue.');
      this.flush('NETWORK_RESTORED');
    });
  }

  // Utility to extract Supabase session token from localStorage if present
  private getAuthToken(): string | null {
    try {
      // Note: Adjust the storage key to match your exact Supabase project ref if using custom storage
      const storageKey = Object.keys(localStorage).find(key => key.includes('supabase.auth.token'));
      if (storageKey) {
        const sessionData = JSON.parse(localStorage.getItem(storageKey) || '{}');
        return sessionData?.access_token || null;
      }
    } catch {
      return null;
    }
    return null;
  }
}

// Export a single instance to be shared across the entire application
export const trackingManager = new TrackingManager();