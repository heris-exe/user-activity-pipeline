import type {
  AnalyticsSnapshot,
  RegionSummary,
  ScoreDistributionBucket,
  UserAnalyticsRecord,
} from "@/lib/types";
import {
  buildRegionSummariesFromUsers,
  buildScoreDistributionFromUsers,
} from "@/lib/analytics-builder";

export type RegionFilter = "all" | number;
export type SortKey =
  | "engagementScore"
  | "purchaseAmount"
  | "sessionDurationSec"
  | "pagesViewed"
  | "userId";
export type SortDirection = "asc" | "desc";

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

export interface SelectionMetrics {
  totalUsers: number;
  totalRevenue: number;
  averageSessionSec: number;
  averageEngagementScore: number;
  highValueUsers: number;
}

export interface RegionDisplayMeta {
  code: string;
  name: string;
  color: string;
}

const regionMetaMap: Record<number, RegionDisplayMeta> = {
  0: {
    code: "NA",
    name: "North America",
    color: "#E5552B",
  },
  1: {
    code: "EU",
    name: "Europe",
    color: "#2E4E6F",
  },
  2: {
    code: "APAC",
    name: "Asia-Pacific",
    color: "#3F6B46",
  },
  3: {
    code: "LATAM",
    name: "Latin America",
    color: "#C9A24B",
  },
  4: {
    code: "MEA",
    name: "Middle East & Africa",
    color: "#A93226",
  },
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMetricNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits,
  }).format(value);
}

export function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatUserCode(userId: number) {
  return `U-${String(userId).padStart(5, "0")}`;
}

export function getRegionMeta(regionId: number): RegionDisplayMeta {
  return (
    regionMetaMap[regionId] ?? {
      code: `R${regionId}`,
      name: `Region ${regionId}`,
      color: "#141210",
    }
  );
}

export function filterUsers(
  users: UserAnalyticsRecord[],
  regionFilter: RegionFilter,
  searchQuery: string,
) {
  const normalizedQuery = searchQuery.trim().toUpperCase();
  const numericQuery = normalizedQuery.replace(/[^0-9]/g, "");

  return users.filter((user) => {
    const regionMatch = regionFilter === "all" || user.regionId === regionFilter;
    const searchMatch =
      normalizedQuery.length === 0 ||
      formatUserCode(user.userId).includes(normalizedQuery) ||
      (numericQuery.length > 0 && String(user.userId).includes(numericQuery));

    return regionMatch && searchMatch;
  });
}

export function getRegionScopedUsers(users: UserAnalyticsRecord[], regionFilter: RegionFilter) {
  if (regionFilter === "all") {
    return users;
  }

  return users.filter((user) => user.regionId === regionFilter);
}

export function sortUsers(users: UserAnalyticsRecord[], sortState: SortState) {
  const direction = sortState.direction === "asc" ? 1 : -1;

  return [...users].sort((left, right) => {
    const leftValue = left[sortState.key];
    const rightValue = right[sortState.key];

    if (leftValue < rightValue) {
      return -1 * direction;
    }

    if (leftValue > rightValue) {
      return 1 * direction;
    }

    return left.userId - right.userId;
  });
}

export function toggleSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return {
      key,
      direction: current.direction === "desc" ? "asc" : "desc",
    };
  }

  return {
    key,
    direction: key === "userId" ? "asc" : "desc",
  };
}

export function buildSelectionMetrics(users: UserAnalyticsRecord[]): SelectionMetrics {
  const totalUsers = users.length;

  if (totalUsers === 0) {
    return {
      totalUsers: 0,
      totalRevenue: 0,
      averageSessionSec: 0,
      averageEngagementScore: 0,
      highValueUsers: 0,
    };
  }

  return {
    totalUsers,
    totalRevenue: Number(
      users.reduce((sum, user) => sum + user.purchaseAmount, 0).toFixed(2),
    ),
    averageSessionSec: Number(
      (users.reduce((sum, user) => sum + user.sessionDurationSec, 0) / totalUsers).toFixed(2),
    ),
    averageEngagementScore: Number(
      (users.reduce((sum, user) => sum + user.engagementScore, 0) / totalUsers).toFixed(3),
    ),
    highValueUsers: users.filter((user) => user.purchaseAmount > 100).length,
  };
}

export function getRegionChartData(users: UserAnalyticsRecord[]): RegionSummary[] {
  return buildRegionSummariesFromUsers(users);
}

export function getScoreDistribution(users: UserAnalyticsRecord[]): ScoreDistributionBucket[] {
  return buildScoreDistributionFromUsers(users);
}

export function getTopUsers(users: UserAnalyticsRecord[], count = 5) {
  return sortUsers(users, { key: "engagementScore", direction: "desc" }).slice(0, count);
}

export function getSelectedUser(
  users: UserAnalyticsRecord[],
  selectedUserId: number | null,
) {
  if (selectedUserId === null) {
    return null;
  }

  return users.find((user) => user.userId === selectedUserId) ?? null;
}

export function getSnapshot(snapshot: AnalyticsSnapshot) {
  return snapshot;
}
