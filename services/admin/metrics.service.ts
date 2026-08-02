import { supabaseAdmin } from '@/lib/supabase/admin';

export class MetricsService {
  /**
   * Logs system metrics asynchronously. Call this from other services without awaiting.
   */
  static logHealth(service: string, metricType: 'latency' | 'cache_hit' | 'error' | 'fallback', value: number, metadata: any = {}) {
    supabaseAdmin.from('system_health_logs').insert({
      service_name: service,
      metric_type: metricType,
      value: value,
      metadata: metadata
    }).then(({ error }) => {
      if (error) console.error("[Metrics] Failed to log health:", error);
    });
  }
}