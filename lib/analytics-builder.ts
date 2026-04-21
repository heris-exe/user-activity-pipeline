import type {
  AnalyticsSnapshot,
  InsightCard,
  PipelineStage,
  RegionSummary,
  ScoreContribution,
  ScoreDistributionBucket,
  UserAnalyticsRecord,
} from "@/lib/types";

interface RawUserRow {
  userId: number;
  sessionDurationSec: number;
  pagesViewed: number;
  purchaseAmount: number;
  regionId: number;
}

const FEATURE_WEIGHTS = [
  { key: "normalizedSessionDuration", label: "Normalized Session", weight: 0.45 },
  { key: "normalizedPagesViewed", label: "Normalized Pages", weight: 0.25 },
  { key: "normalizedPurchaseAmount", label: "Normalized Purchase", weight: 0.55 },
  { key: "pagesPerSecond", label: "Pages / Second", weight: 0.15 },
  { key: "sqrtPurchaseAmount", label: "Sqrt Purchase", weight: 0.2 },
  { key: "purchaseFlag", label: "Purchase Flag", weight: 0.1 },
] as const;

const FEATURE_BIAS = [0.05, 0.05, 0.1, 0.01, 0.02, 0.03] as const;
const HISTOGRAM_BUCKETS = 8;

function roundTo(value: number, decimals = 6) {
  return Number(value.toFixed(decimals));
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function std(values: number[]) {
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function parseNumber(value: string) {
  return Number.parseFloat(value.trim());
}

export function parseUserEventsCsv(csvText: string) {
  const lines = csvText.trim().split(/\r?\n/);
  const [, ...rows] = lines;

  return rows.map((line) => {
    const [userId, sessionDurationSec, pagesViewed, purchaseAmount, regionId] = line.split(",");

    return {
      userId: Number.parseInt(userId, 10),
      sessionDurationSec: parseNumber(sessionDurationSec),
      pagesViewed: Number.parseInt(pagesViewed, 10),
      purchaseAmount: parseNumber(purchaseAmount),
      regionId: Number.parseInt(regionId, 10),
    } satisfies RawUserRow;
  });
}

export function buildScoreDistributionFromUsers(
  users: UserAnalyticsRecord[],
  bucketCount = HISTOGRAM_BUCKETS,
): ScoreDistributionBucket[] {
  if (users.length === 0) {
    return [];
  }

  const scores = users.map((user) => user.engagementScore);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const span = maxScore - minScore || 1;
  const bucketSize = span / bucketCount;

  return Array.from({ length: bucketCount }, (_, bucketIndex) => {
    const start = minScore + bucketIndex * bucketSize;
    const rawEnd = start + bucketSize;
    const end = bucketIndex === bucketCount - 1 ? maxScore : rawEnd;
    const count = scores.filter((score) => {
      if (bucketIndex === bucketCount - 1) {
        return score >= start && score <= end;
      }

      return score >= start && score < end;
    }).length;

    return {
      bucketIndex,
      label: `${roundTo(start, 1)} to ${roundTo(end, 1)}`,
      start: roundTo(start, 4),
      end: roundTo(end, 4),
      count,
    };
  });
}

export function buildRegionSummariesFromUsers(users: UserAnalyticsRecord[]): RegionSummary[] {
  const regionIds = [...new Set(users.map((user) => user.regionId))].sort((left, right) => left - right);

  return regionIds.map((regionId) => {
    const regionUsers = users.filter((user) => user.regionId === regionId);

    return {
      regionId,
      userCount: regionUsers.length,
      totalRevenue: roundTo(regionUsers.reduce((sum, user) => sum + user.purchaseAmount, 0), 2),
      averageSessionSec: roundTo(mean(regionUsers.map((user) => user.sessionDurationSec)), 2),
      maxPagesViewed: Math.max(...regionUsers.map((user) => user.pagesViewed)),
      minimumSessionSec: roundTo(Math.min(...regionUsers.map((user) => user.sessionDurationSec)), 2),
      averageEngagementScore: roundTo(mean(regionUsers.map((user) => user.engagementScore)), 3),
    };
  });
}

function buildInsights(users: UserAnalyticsRecord[], regions: RegionSummary[]): InsightCard[] {
  const highestSpendingUser = [...users].sort((left, right) => right.purchaseAmount - left.purchaseAmount)[0];
  const highestEngagementUser = [...users].sort(
    (left, right) => right.engagementScore - left.engagementScore,
  )[0];
  const topRegion = [...regions].sort(
    (left, right) => right.averageEngagementScore - left.averageEngagementScore,
  )[0];
  const purchasingUsers = users.filter((user) => user.purchaseFlag);
  const conversionRate = (purchasingUsers.length / users.length) * 100;
  const zeroPurchaseRate = 100 - conversionRate;

  return [
    {
      id: "top-region",
      title: "Top Region by Score",
      value: `Region ${topRegion.regionId}`,
      context: `${topRegion.averageEngagementScore.toFixed(3)} avg engagement score`,
      tone: "cobalt",
    },
    {
      id: "highest-spend",
      title: "Highest Spending User",
      value: `User ${highestSpendingUser.userId}`,
      context: `$${highestSpendingUser.purchaseAmount.toFixed(2)} in purchase value`,
      tone: "coral",
    },
    {
      id: "highest-score",
      title: "Highest Engagement User",
      value: `User ${highestEngagementUser.userId}`,
      context: `${highestEngagementUser.engagementScore.toFixed(3)} engagement score`,
      tone: "green",
    },
    {
      id: "conversion",
      title: "Purchase Conversion Snapshot",
      value: `${conversionRate.toFixed(1)}% purchased`,
      context: `${zeroPurchaseRate.toFixed(1)}% still zero-purchase users`,
      tone: "teal",
    },
  ];
}

function buildPipelineStages(): PipelineStage[] {
  return [
    {
      id: "export",
      label: "Operational Export",
      detail: "Raw user_events CSV standing in for PostgreSQL OLTP data.",
    },
    {
      id: "etl",
      label: "ETL Transform",
      detail: "Session, page, and purchase fields normalized into analytics-ready features.",
    },
    {
      id: "features",
      label: "Feature Matrix",
      detail: "Bias-adjusted feature vectors aligned for model-style scoring.",
    },
    {
      id: "score",
      label: "Engagement Score",
      detail: "Weighted matrix math produces a per-user engagement ranking.",
    },
    {
      id: "reverse-etl",
      label: "Reverse ETL",
      detail: "Derived score becomes product-facing output for prioritization and targeting.",
    },
  ];
}

export function buildAnalyticsSnapshotFromRows(
  rows: RawUserRow[],
  sourceFile = "user_events.csv",
): AnalyticsSnapshot {
  const sessionValues = rows.map((row) => row.sessionDurationSec);
  const pagesValues = rows.map((row) => row.pagesViewed);
  const purchaseValues = rows.map((row) => row.purchaseAmount);

  const sessionMean = mean(sessionValues);
  const pagesMean = mean(pagesValues);
  const purchaseMean = mean(purchaseValues);
  const sessionStd = std(sessionValues) || 1;
  const pagesStd = std(pagesValues) || 1;
  const purchaseStd = std(purchaseValues) || 1;

  const users: UserAnalyticsRecord[] = rows.map((row) => {
    const normalizedSessionDuration = (row.sessionDurationSec - sessionMean) / sessionStd;
    const normalizedPagesViewed = (row.pagesViewed - pagesMean) / pagesStd;
    const normalizedPurchaseAmount = (row.purchaseAmount - purchaseMean) / purchaseStd;
    const pagesPerSecond = row.pagesViewed / Math.max(row.sessionDurationSec, 1);
    const sqrtPurchaseAmount = Math.sqrt(row.purchaseAmount);
    const purchaseFlagValue = row.purchaseAmount > 0 ? 1 : 0;

    const featureValues = [
      normalizedSessionDuration,
      normalizedPagesViewed,
      normalizedPurchaseAmount,
      pagesPerSecond,
      sqrtPurchaseAmount,
      purchaseFlagValue,
    ];

    const scoreBreakdown: ScoreContribution[] = FEATURE_WEIGHTS.map((feature, index) => {
      const value = featureValues[index] + FEATURE_BIAS[index];

      return {
        key: feature.key,
        label: feature.label,
        value: roundTo(value),
        weight: feature.weight,
        contribution: roundTo(value * feature.weight),
      };
    });

    const engagementScore = scoreBreakdown.reduce(
      (sum, contribution) => sum + contribution.contribution,
      0,
    );

    return {
      userId: row.userId,
      sessionDurationSec: roundTo(row.sessionDurationSec, 2),
      pagesViewed: row.pagesViewed,
      purchaseAmount: roundTo(row.purchaseAmount, 2),
      regionId: row.regionId,
      engagementScore: roundTo(engagementScore),
      pagesPerSecond: roundTo(pagesPerSecond),
      sqrtPurchaseAmount: roundTo(sqrtPurchaseAmount),
      normalizedSessionDuration: roundTo(normalizedSessionDuration),
      normalizedPagesViewed: roundTo(normalizedPagesViewed),
      normalizedPurchaseAmount: roundTo(normalizedPurchaseAmount),
      purchaseFlag: Boolean(purchaseFlagValue),
      purchaseStatus: purchaseFlagValue ? "Purchased" : "No Purchase",
      scoreBreakdown,
    };
  });

  const regions = buildRegionSummariesFromUsers(users);
  const scoreDistribution = buildScoreDistributionFromUsers(users);
  const regionIds = regions.map((region) => region.regionId);
  const topUserIds = [...users]
    .sort((left, right) => right.engagementScore - left.engagementScore)
    .slice(0, 5)
    .map((user) => user.userId);

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceFile,
      totalUsers: users.length,
      totalRevenue: roundTo(users.reduce((sum, user) => sum + user.purchaseAmount, 0), 2),
      averageSessionSec: roundTo(mean(users.map((user) => user.sessionDurationSec)), 2),
      averageEngagementScore: roundTo(mean(users.map((user) => user.engagementScore)), 3),
      highValueUsers: users.filter((user) => user.purchaseAmount > 100).length,
      regionIds,
      topUserIds,
    },
    regions,
    users,
    scoreDistribution,
    insights: buildInsights(users, regions),
    pipelineStages: buildPipelineStages(),
  };
}

export function buildAnalyticsSnapshotFromCsvText(csvText: string, sourceFile = "user_events.csv") {
  return buildAnalyticsSnapshotFromRows(parseUserEventsCsv(csvText), sourceFile);
}
