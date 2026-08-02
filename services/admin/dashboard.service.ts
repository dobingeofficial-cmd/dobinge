import { AnalyticsService } from './analytics.service';
import { HealthService } from './health.service';
import { AdminDashboardPayload } from '@/types/admin.types';

export class DashboardService {
  static async getFullDashboard(): Promise<AdminDashboardPayload> {
    const [recs, search, users, health, alerts] = await Promise.all([
      AnalyticsService.getRecommendationMetrics(),
      AnalyticsService.getSearchMetrics(),
      AnalyticsService.getUserMetrics(),
      HealthService.getHealthMetrics(),
      HealthService.getActiveAlerts()
    ]);

    // Async background task to check health limits without slowing dashboard load
    HealthService.evaluateAndAlert(health).catch(console.error);

    return {
      recommendations: recs,
      search: search,
      users: users,
      health: health,
      activeAlerts: alerts
    };
  }
}