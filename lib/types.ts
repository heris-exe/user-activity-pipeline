export interface ScoreContribution {
  key: string;
  label: string;
  value: number;
  weight: number;
  contribution: number;
}

export interface UserAnalyticsRecord {
  userId: number;
  sessionDurationSec: number;
  pagesViewed: number;
  purchaseAmount: number;
  regionId: number;
  engagementScore: number;
  pagesPerSecond: number;
  sqrtPurchaseAmount: number;
  normalizedSessionDuration: number;
  normalizedPagesViewed: number;
  normalizedPurchaseAmount: number;
  purchaseFlag: boolean;
  purchaseStatus: "Purchased" | "No Purchase";
  scoreBreakdown: ScoreContribution[];
}

export interface AnalyticsMetadata {
  generatedAt: string;
  sourceFile: string;
  totalUsers: number;
  totalRevenue: number;
  averageSessionSec: number;
  averageEngagementScore: number;
  highValueUsers: number;
  regionIds: number[];
  topUserIds: number[];
}

export interface RegionSummary {
  regionId: number;
  userCount: number;
  totalRevenue: number;
  averageSessionSec: number;
  maxPagesViewed: number;
  minimumSessionSec: number;
  averageEngagementScore: number;
}

export interface ScoreDistributionBucket {
  bucketIndex: number;
  label: string;
  start: number;
  end: number;
  count: number;
}

export interface InsightCard {
  id: string;
  title: string;
  value: string;
  context: string;
  tone: "cobalt" | "teal" | "coral" | "green";
}

export interface PipelineStage {
  id: string;
  label: string;
  detail: string;
}

export interface AnalyticsSnapshot {
  metadata: AnalyticsMetadata;
  regions: RegionSummary[];
  users: UserAnalyticsRecord[];
  scoreDistribution: ScoreDistributionBucket[];
  insights: InsightCard[];
  pipelineStages: PipelineStage[];
}
