import { logger } from './logger';

interface FetchRetryOptions extends RequestInit {
  retries?: number;
  backoffMs?: number;
  timeoutMs?: number;
}

export async function fetchWithRetry(url: string, options: FetchRetryOptions = {}): Promise<Response> {
  const { retries = 2, backoffMs = 300, timeoutMs = 5000, ...fetchOptions } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
      clearTimeout(timeoutId);

      // If success or a client error (4xx), return immediately. Don't retry 400s.
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (attempt === retries) {
        logger.error(`[Fetch] Failed after ${retries} retries`, { url, error: error.message });
        throw error;
      }

      // Exponential backoff: 300ms, 600ms, 1200ms...
      const waitTime = backoffMs * Math.pow(2, attempt);
      logger.warn(`[Fetch] Attempt ${attempt + 1} failed, retrying in ${waitTime}ms`, { url });
      await new Promise(res => setTimeout(res, waitTime));
    }
  }
  throw new Error("Unreachable");
}