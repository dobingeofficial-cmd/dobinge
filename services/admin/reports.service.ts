import { AnalyticsService } from './analytics.service';
import { HealthService } from './health.service';

export class ReportsService {
  static async generateDailyReport() {
    const [recs, search, users, health] = await Promise.all([
      AnalyticsService.getRecommendationMetrics(24),
      AnalyticsService.getSearchMetrics(24),
      AnalyticsService.getUserMetrics(24),
      HealthService.getHealthMetrics()
    ]);

    return {
      reportType: 'DAILY_SUMMARY',
      generatedAt: new Date().toISOString(),
      summary: {
        totalUsers: users.dailyActiveUsers,
        totalRecommendations: recs.totalGenerated,
        totalSearches: search.totalSearches,
        overallHealth: health.errorRate > 10 ? 'DEGRADED' : 'OPTIMAL'
      },
      details: { recs, search, users, health }
    };
  }
}