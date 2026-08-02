export interface RecommendationMetrics {
  averageConfidence: number;
  totalGenerated: number;
  wildcardsAccepted: number;
  hiddenGemsServed: number;
}

export interface SearchMetrics {
  totalSearches: number;
  semanticSearches: number;
  zeroResultSearches: number;
  abandonmentRate: number;
}

export interface UserMetrics {
  dailyActiveUsers: number;
  guestUsers: number;
  signedInUsers: number;
  averageSessionDuration: number;
}

export interface SystemHealthMetrics {
  averageApiLatency: number;
  recommendationLatency: number;
  aiCacheHitRate: number;
  aiFallbackRate: number;
  errorRate: number;
}

export interface AdminDashboardPayload {
  recommendations: RecommendationMetrics;
  search: SearchMetrics;
  users: UserMetrics;
  health: SystemHealthMetrics;
  activeAlerts: any[];
}