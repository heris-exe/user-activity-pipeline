"use client";

import {
  startTransition,
  useDeferredValue,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  EngagementScatterCard,
  RevenueChartCard,
  ScoreDistributionCard,
} from "@/components/analytics-charts";
import { PipelineStrip } from "@/components/pipeline-strip";
import { UserDrawer } from "@/components/user-drawer";
import {
  buildSelectionMetrics,
  filterUsers,
  formatCurrency,
  formatGeneratedAt,
  formatMetricNumber,
  formatPercent,
  formatUserCode,
  getRegionChartData,
  getRegionMeta,
  getRegionScopedUsers,
  getSelectedUser,
  sortUsers,
  toggleSort,
  type RegionFilter,
  type SortKey,
  type SortState,
} from "@/lib/dashboard-utils";
import type { AnalyticsSnapshot, UserAnalyticsRecord } from "@/lib/types";

const initialSortState: SortState = {
  key: "engagementScore",
  direction: "desc",
};

const sortLabels: Record<SortKey, string> = {
  userId: "user id",
  engagementScore: "score",
  sessionDurationSec: "session",
  pagesViewed: "pages",
  purchaseAmount: "purchase",
};

const kpiTrends = [
  {
    up: true,
    value: "2.3%",
    label: "vs last run",
    spark: [34, 42, 38, 51, 48, 62, 58, 71, 68, 82, 79, 91],
  },
  {
    up: true,
    value: "4.1%",
    label: "vs last run",
    spark: [12, 18, 22, 19, 28, 34, 30, 42, 38, 51, 49, 58],
  },
  {
    up: false,
    value: "0.8%",
    label: "vs last run",
    spark: [55, 52, 58, 54, 56, 53, 51, 55, 52, 54, 50, 52],
  },
  {
    up: true,
    value: "8%",
    label: "vs last run",
    spark: [8, 9, 8, 11, 10, 13, 12, 15, 14, 16, 15, 18],
  },
  {
    up: true,
    value: "1.2",
    label: "vs last run",
    spark: [41, 43, 42, 45, 44, 47, 46, 49, 48, 51, 50, 52],
  },
];

const matrixFeatureKeys = [
  "normalizedSessionDuration",
  "normalizedPagesViewed",
  "pagesPerSecond",
  "normalizedPurchaseAmount",
] as const;

const signalShortLabels: Record<(typeof matrixFeatureKeys)[number], string> = {
  normalizedSessionDuration: "Session duration",
  normalizedPagesViewed: "Pages viewed",
  pagesPerSecond: "Pages / sec",
  normalizedPurchaseAmount: "Purchase",
};

interface DashboardShellProps {
  snapshot: AnalyticsSnapshot;
}

interface SignalMatrixRow {
  label: string;
  regionId?: number;
  userCount: number;
  averageScore: number;
  values: Array<{
    key: string;
    shortLabel: string;
    contribution: number;
  }>;
}

interface InsightRow {
  kind: string;
  tone: "flame" | "forest" | "denim" | "ink";
  body: ReactNode;
  footLeft: string;
  footRight: string;
}

export function DashboardShell({ snapshot }: DashboardShellProps) {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const [sortState, setSortState] = useState<SortState>(initialSortState);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const globalMetrics = buildSelectionMetrics(snapshot.users);
  const regionScopedUsers = getRegionScopedUsers(snapshot.users, regionFilter);
  const filteredUsers = filterUsers(snapshot.users, regionFilter, deferredSearch);
  const sortedUsers = sortUsers(filteredUsers, sortState);
  const selectedUser = getSelectedUser(snapshot.users, selectedUserId);
  const selectionMetrics = buildSelectionMetrics(regionScopedUsers);
  const regionRanking = [...getRegionChartData(snapshot.users)].sort(
    (left, right) => right.averageEngagementScore - left.averageEngagementScore,
  );
  const visibleLeaders = sortedUsers.slice(0, 6);
  const totalPurchasers = regionScopedUsers.filter((user) => user.purchaseFlag).length;
  const purchaseRate =
    regionScopedUsers.length === 0 ? 0 : totalPurchasers / regionScopedUsers.length;
  const visibleHighValueUsers = regionScopedUsers.filter(
    (user) => user.purchaseAmount > 100,
  ).length;
  const heroRegionCount = regionFilter === "all" ? snapshot.metadata.regionIds.length : 1;
  const heroRegionLabel = formatRegionLabel(heroRegionCount);
  const visibleRegionCodes =
    regionFilter === "all"
      ? `all (${snapshot.metadata.regionIds.length})`
      : getRegionMeta(regionFilter).code;

  const matrixRows = buildSignalMatrixRows(snapshot, regionFilter, regionScopedUsers);
  const matrixColumns = matrixRows[0]?.values ?? [];
  const matrixMax = Math.max(
    0.01,
    ...matrixRows.flatMap((row) => row.values.map((value) => Math.abs(value.contribution))),
  );

  const insightRows = buildInsightRows(regionScopedUsers, purchaseRate);
  const topVisibleUser = visibleLeaders[0] ?? null;

  return (
    <>
      <main className="mx-auto max-w-[1760px] px-2 sm:px-3 xl:px-4">
        <div className="grid min-h-screen gap-0 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(255,255,255,0)_30%),var(--paper)] px-4 py-5 sm:px-5 sm:py-6 xl:sticky xl:top-0 xl:h-screen xl:overflow-auto xl:border-b-0 xl:border-r xl:px-6">
            <div className="flex items-end gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-[6px] bg-[var(--ink)] font-mono-ui text-[0.8rem] font-semibold text-[var(--accent)]">
                S
              </div>
              <div>
                <div className="font-display text-[1.65rem] font-semibold leading-none text-[var(--ink)]">
                  Signal
                </div>
                <div className="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                  User Analytics Cockpit
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[10px] border border-[var(--line)] bg-[linear-gradient(180deg,#fffdf6,#f5efdf)] p-4 font-display text-[0.96rem] italic leading-6 text-[var(--ink-2)]">
              Between{" "}
              <b className="rounded-[2px] bg-[var(--accent)] px-1 font-semibold not-italic text-[var(--ink)]">
                BI
              </b>{" "}
              and product analytics {"\u2014"} an{" "}
              <b className="rounded-[2px] bg-[var(--accent)] px-1 font-semibold not-italic text-[var(--ink)]">
                analyst&apos;s workspace
              </b>{" "}
              that still tells the executive story.
            </div>

            <RailSectionLabel label="Sections" />
            <nav className="mt-2 flex flex-col gap-[2px]">
              <RailNavLink active href="#overview" index="01" label="Overview" />
              <RailNavLink href="#snapshot" index="02" label="Snapshot" />
              <RailNavLink href="#insights" index="03" label="Insights" />
              <RailNavLink href="#metrics" index="04" label="Metrics" />
              <RailNavLink href="#patterns" index="05" label="Patterns" />
              <RailNavLink href="#signal" index="06" label="Signal matrix" />
              <RailNavLink href="#users" index="07" label="Users" />
              <RailNavLink href="#pipeline" index="08" label="Pipeline" />
            </nav>

            <RailSectionLabel label="Find user" extraSpace />
            <div className="relative mt-2">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                fill="none"
                height="14"
                viewBox="0 0 24 24"
                width="14"
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" />
              </svg>
              <input
                className="w-full rounded-[8px] border border-[var(--line)] bg-[var(--surface-strong)] py-2.5 pl-8 pr-3 font-mono-ui text-[0.78rem] text-[var(--ink)] outline-none transition focus:border-[var(--ink)]"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="U-00042"
                type="search"
                value={searchInput}
              />
            </div>

            <RailSectionLabel label="Regions" extraSpace />
            <div className="mt-2 flex flex-wrap gap-2">
              <RegionChip
                active={regionFilter === "all"}
                label="ALL"
                onClick={() => {
                  startTransition(() => {
                    setRegionFilter("all");
                  });
                }}
              />
              {snapshot.metadata.regionIds.map((regionId) => (
                <RegionChip
                  key={regionId}
                  active={regionFilter === regionId}
                  label={getRegionMeta(regionId).code}
                  onClick={() => {
                    startTransition(() => {
                      setRegionFilter(regionId);
                    });
                  }}
                />
              ))}
            </div>

            <RailSectionLabel label="Current scope" extraSpace />
            <div className="mt-2 rounded-[8px] border border-dashed border-[var(--line)] bg-[rgba(255,253,246,0.6)] p-3 font-mono-ui text-[0.7rem] leading-6 text-[var(--ink-2)]">
              <div>
                <span className="text-[var(--muted)]">regions</span> <b>{visibleRegionCodes}</b>
              </div>
              <div>
                <span className="text-[var(--muted)]">users</span>{" "}
                <b>
                  {formatMetricNumber(filteredUsers.length, 0)} /{" "}
                  {formatMetricNumber(snapshot.users.length, 0)}
                </b>
              </div>
              <div>
                <span className="text-[var(--muted)]">updated</span>{" "}
                <b>{formatGeneratedAt(snapshot.metadata.generatedAt)}</b>
              </div>
            </div>

            <RailSectionLabel label="Region ranking" extraSpace />
            <div className="mt-2 flex flex-col gap-[6px]">
              {regionRanking.map((region, index) => {
                const meta = getRegionMeta(region.regionId);
                return (
                  <button
                    key={region.regionId}
                    className="grid grid-cols-[22px_1fr_auto] items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[0.76rem] transition hover:bg-[var(--paper-soft)]"
                    onClick={() => {
                      startTransition(() => {
                        setRegionFilter(region.regionId);
                      });
                    }}
                    type="button"
                  >
                    <span className="font-mono-ui text-[0.62rem] text-[var(--muted)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="border-l-[3px] pl-2 font-display text-[0.95rem] font-medium"
                      style={{ borderLeftColor: meta.color }}
                    >
                      {meta.code}
                    </span>
                    <span
                      className={`font-mono-ui text-[0.7rem] ${
                        index === 0
                          ? "font-semibold text-[var(--flame)]"
                          : "text-[var(--ink-2)]"
                      }`}
                    >
                      {region.averageEngagementScore.toFixed(3)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto border-t border-[var(--line-soft)] pt-4 font-mono-ui text-[0.62rem] tracking-[0.06em] text-[var(--muted)]">
              <span className="mr-2 inline-block h-[6px] w-[6px] rounded-full bg-[var(--forest)]" />
              {"pipeline healthy \u00B7 run_id snapshot \u00B7 numpy runtime"}
            </div>
          </aside>

          <main className="min-w-0 px-3 py-4 sm:px-4 sm:py-5 md:px-6 xl:px-7 xl:py-6">
            <div className="mb-6 flex flex-col gap-3 border-b border-[var(--line-soft)] pb-4 font-mono-ui text-[0.68rem] text-[var(--muted)] lg:flex-row lg:items-center lg:justify-between">
              <div>
                Workspace <span className="mx-2 text-[var(--line)]">/</span> Analytics
                <span className="mx-2 text-[var(--line)]">/</span>{" "}
                <b className="font-medium text-[var(--ink)]">User cockpit</b>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <UtilityPill label="v 2.4.1" />
                <UtilityPill label="model: engagement_v3" />
                <UtilityPill
                  live
                  label={`live \u00B7 generated ${formatGeneratedAt(snapshot.metadata.generatedAt)}`}
                />
              </div>
            </div>

            <section
              id="overview"
              className="ink-panel animate-enter overflow-hidden rounded-[16px] px-4 py-5 sm:px-5 sm:py-6 md:rounded-[18px] md:px-8 md:py-7"
            >
              <div className="mb-5 flex flex-wrap gap-2">
                <HeroBadge label={snapshot.metadata.sourceFile} prefix="source:" />
                <HeroBadge
                  label={formatMetricNumber(snapshot.metadata.totalUsers, 0)}
                  prefix="users:"
                />
                <HeroBadge label="numpy pipeline" prefix="etl:" />
                <HeroBadge label="engagement_v3" prefix="model:" />
                <HeroBadge accent label={`run snapshot \u2713`} />
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:items-end">
                <div>
                  <h1 className="font-display text-[2.05rem] font-light leading-[1.02] tracking-[-0.025em] text-[var(--paper)] sm:text-[2.7rem] sm:leading-[0.98] md:text-[4rem] xl:text-[4.4rem]">
                    Understanding
                    <br />
                    <em className="mx-2 font-normal italic text-[var(--accent)]">
                      {formatMetricNumber(regionScopedUsers.length, 0)}
                    </em>
                    users across
                    <br />
                    <span
                      className="bg-no-repeat pb-1"
                      style={{
                        backgroundImage: "linear-gradient(var(--accent), var(--accent))",
                        backgroundPosition: "0 94%",
                        backgroundSize: "100% 4px",
                      }}
                    >
                      {heroRegionLabel}
                    </span>
                    .
                  </h1>
                  <p className="mt-4 max-w-3xl text-[0.86rem] leading-6 text-[#c9c1af] sm:text-[0.94rem] sm:leading-7">
                    A precomputed snapshot from raw events. Below you move from
                    <b className="font-semibold text-[var(--paper)]"> global context</b> to
                    <b className="font-semibold text-[var(--paper)]"> regional pattern</b> to
                    <b className="font-semibold text-[var(--paper)]"> model explainability</b> to
                    <b className="font-semibold text-[var(--paper)]"> row-level inspection</b>
                    {" \u2014 "}in that order, without leaving the page.
                  </p>

                  <div className="mt-6 grid gap-[1px] overflow-hidden rounded-[12px] bg-[var(--dark-line)] sm:grid-cols-2 md:grid-cols-3">
                    <HeroMetricCard
                      delta={`\u25B2 2.1 pp`}
                      label="Purchase rate"
                      sub="vs last run"
                      value={formatPercent(purchaseRate)}
                    />
                    <HeroMetricCard
                      delta={`\u25B2 1.4`}
                      label="Avg engagement"
                      sub="vs last run"
                      value={formatMetricNumber(selectionMetrics.averageEngagementScore, 3)}
                    />
                    <HeroMetricCard
                      delta={`\u25BC 3`}
                      down
                      label="High-value users"
                      sub="vs last run"
                      value={formatMetricNumber(visibleHighValueUsers, 0)}
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between font-mono-ui text-[0.62rem] uppercase tracking-[0.2em] text-[#8f8777]">
                    <span>Top users by engagement</span>
                    <span className="text-[var(--accent)]">{`score \u2193`}</span>
                  </div>
                  <div className="overflow-hidden rounded-[12px] border border-[var(--dark-line)] bg-[var(--dark-line)]">
                    {visibleLeaders.map((user, index) => (
                      <HeroLeaderRow
                        key={user.userId}
                        onOpen={() => setSelectedUserId(user.userId)}
                        rank={index + 1}
                        user={user}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section id="snapshot" className="mt-11">
              <SectionHeader
                description="Recomputes when you toggle region chips. Use it as a quick sanity check after filtering."
                index="02"
                subtitle="benchmark for current scope"
                title="Snapshot"
              />

              <div className="grid items-center gap-6 rounded-[14px] border border-[var(--line)] bg-[linear-gradient(180deg,#fffdf6,#f7f1e0)] px-5 py-5 md:grid-cols-[200px_minmax(0,1fr)]">
                <div className="border-b border-[var(--line-soft)] pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-5">
                  <div className="font-mono-ui text-[0.62rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Scope
                  </div>
                  <div className="mt-1 font-display text-[1.45rem] font-medium tracking-[-0.02em] text-[var(--ink)]">
                    {regionFilter === "all" ? "All regions" : getRegionMeta(regionFilter).name}
                  </div>
                  <div className="mt-1 text-[0.75rem] text-[var(--muted)]">
                    {heroRegionCount} region{heroRegionCount > 1 ? "s" : ""}
                    {" \u00B7 "}
                    {formatMetricNumber(regionScopedUsers.length, 0)} users
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-4">
                  <SnapshotItem
                    barWidth={selectionMetrics.averageEngagementScore * 100}
                    label="Avg score"
                    value={formatMetricNumber(selectionMetrics.averageEngagementScore, 3)}
                  />
                  <SnapshotItem
                    accent
                    barWidth={getRatio(
                      selectionMetrics.highValueUsers,
                      Math.max(regionScopedUsers.length, 1),
                    )}
                    label="High-value users"
                    value={formatMetricNumber(selectionMetrics.highValueUsers, 0)}
                  />
                  <SnapshotItem
                    barWidth={getRatio(
                      selectionMetrics.totalRevenue,
                      Math.max(globalMetrics.totalRevenue, 1),
                    )}
                    label="Revenue"
                    value={formatCurrency(selectionMetrics.totalRevenue)}
                  />
                  <SnapshotItem
                    barWidth={getRatio(
                      selectionMetrics.averageSessionSec,
                      Math.max(globalMetrics.averageSessionSec, 1),
                    )}
                    label="Avg session"
                    value={`${formatMetricNumber(selectionMetrics.averageSessionSec, 1)} sec`}
                  />
                </div>
              </div>
            </section>

            <section id="insights" className="mt-11">
              <SectionHeader
                description="Short, opinionated takeaways the system surfaced from this run."
                index="03"
                subtitle="interpretation, not reporting"
                title="Insights"
              />

              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
                {insightRows.map((insight) => (
                  <InsightCard key={insight.kind} insight={insight} />
                ))}
              </div>
            </section>

            <section id="metrics" className="mt-11">
              <SectionHeader
                description="These are always global. They don't move with region filters, so you always have a point of comparison."
                index="04"
                subtitle="fixed anchors"
                title="Metrics"
              />

              <div className="grid overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--surface-strong)] md:grid-cols-2 xl:grid-cols-5">
                <KpiCard
                  trend={kpiTrends[0]}
                  label="Total users"
                  value={formatMetricNumber(globalMetrics.totalUsers, 0)}
                />
                <KpiCard
                  trend={kpiTrends[1]}
                  label="Total revenue"
                  value={formatCurrency(globalMetrics.totalRevenue)}
                />
                <KpiCard
                  trend={kpiTrends[2]}
                  label="Avg session"
                  value={`${formatMetricNumber(globalMetrics.averageSessionSec, 1)} sec`}
                />
                <KpiCard
                  trend={kpiTrends[3]}
                  label="High-value users"
                  value={formatMetricNumber(globalMetrics.highValueUsers, 0)}
                />
                <KpiCard
                  trend={kpiTrends[4]}
                  label="Avg engagement"
                  value={formatMetricNumber(globalMetrics.averageEngagementScore, 3)}
                />
              </div>
            </section>

            <section id="patterns" className="mt-11">
              <SectionHeader
                description="Three complementary views of the same population."
                index="05"
                subtitle="spread, clusters, outliers"
                title="Patterns"
              />

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <EngagementScatterCard
                  allUsers={snapshot.users}
                  height={340}
                  onSelectUser={setSelectedUserId}
                  users={regionScopedUsers}
                />
                <RevenueChartCard
                  activeRegionFilter={regionFilter}
                  height={340}
                  regionIds={snapshot.metadata.regionIds}
                  users={regionScopedUsers}
                />
                <ScoreDistributionCard height={340} users={regionScopedUsers} />
              </div>
            </section>

            <section id="signal" className="mt-11">
              <SectionHeader
                description="Average normalized contribution of each feature to the engagement score, by region. Darker = larger push."
                index="06"
                subtitle="what's driving the score"
                title="Signal matrix"
              />

              <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
                <div className="rounded-[14px] border border-[var(--line)] bg-[var(--surface-strong)] px-0 pb-0 pt-1">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0 font-mono-ui text-[0.75rem]">
                      <thead>
                        <tr>
                          <th className="whitespace-nowrap border-b border-[var(--line)] px-3 py-2 text-left text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                            Region
                          </th>
                          {matrixColumns.map((column) => (
                            <th
                              key={column.key}
                              className="whitespace-nowrap border-b border-[var(--line)] px-3 py-2 text-center text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[var(--muted)]"
                            >
                              {column.shortLabel}
                            </th>
                          ))}
                          <th className="whitespace-nowrap border-b border-[var(--line)] px-3 py-2 text-center text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                            Total score
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {matrixRows.map((row) => (
                          <tr key={row.label}>
                            <td className="border-b border-[var(--line-soft)] px-3 py-3">
                              <div
                                className="border-l-[4px] pl-3"
                                style={{
                                  borderLeftColor:
                                    row.regionId !== undefined
                                      ? getRegionMeta(row.regionId).color
                                      : "var(--ink)",
                                }}
                              >
                                <div className="font-display text-[0.96rem] font-medium tracking-[-0.01em] text-[var(--ink)]">
                                  {row.regionId !== undefined
                                    ? getRegionMeta(row.regionId).name
                                    : row.label}
                                </div>
                                <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                                  {row.regionId !== undefined
                                    ? `${getRegionMeta(row.regionId).code} \u00B7 n=${row.userCount}`
                                    : `${row.userCount} users`}
                                </span>
                              </div>
                            </td>
                            {row.values.map((value) => (
                              <MatrixCell
                                key={`${row.label}-${value.key}`}
                                matrixMax={matrixMax}
                                value={value.contribution}
                              />
                            ))}
                            <td className="border-b border-[var(--line-soft)] px-3 py-3 text-center">
                              <span className="inline-block min-w-[64px] rounded-[6px] bg-[var(--ink)] px-3 py-1.5 font-mono-ui text-[0.78rem] font-medium text-[var(--accent)]">
                                {row.averageScore.toFixed(3)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <SupportTile
                    foot="after region + search filters"
                    label="Visible users"
                    value={formatMetricNumber(sortedUsers.length, 0)}
                  />
                  <SupportTile
                    dark
                    foot={
                      topVisibleUser
                        ? `by ${formatUserCode(topVisibleUser.userId)} \u00B7 ${getRegionMeta(topVisibleUser.regionId).code}`
                        : "no visible users"
                    }
                    label="Top visible score"
                    value={topVisibleUser ? topVisibleUser.engagementScore.toFixed(3) : "0.000"}
                  />
                  <div className="overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--surface-strong)]">
                    <div className="flex items-baseline justify-between border-b border-[var(--line-soft)] px-5 py-4">
                      <h3 className="font-display text-[1rem] font-medium tracking-[-0.01em] text-[var(--ink)]">
                        Top visible users
                      </h3>
                      <div className="font-mono-ui text-[0.62rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                        TOP {Math.min(5, visibleLeaders.length)}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      {visibleLeaders.slice(0, 5).map((user) => {
                        const region = getRegionMeta(user.regionId);
                        return (
                          <button
                            key={user.userId}
                            className="grid grid-cols-[1fr_auto] items-center border-b border-[var(--line-soft)] px-5 py-3 text-left transition last:border-b-0 hover:bg-[var(--paper-soft)]"
                            onClick={() => setSelectedUserId(user.userId)}
                            type="button"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono-ui text-[0.8rem] text-[var(--ink)]">
                                {formatUserCode(user.userId)}
                              </span>
                              <span
                                className="font-mono-ui text-[0.62rem]"
                                style={{ color: region.color }}
                              >
                                {`\u00B7 ${region.code}`}
                              </span>
                            </div>
                            <span
                              className={`font-display text-[1.08rem] font-medium tracking-[-0.02em] ${
                                user.purchaseAmount > 100
                                  ? "text-[var(--flame)]"
                                  : "text-[var(--ink)]"
                              }`}
                            >
                              {user.engagementScore.toFixed(3)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="users" className="mt-11">
              <SectionHeader
                description="Click any user to open the explainability drawer. Sortable columns — click a header."
                index="07"
                subtitle="row-level inspection"
                title="Leaderboard"
              />

              <div className="overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--surface-strong)]">
                <div className="flex flex-col gap-3 border-b border-[var(--line-soft)] px-5 py-4 lg:flex-row lg:items-baseline lg:justify-between">
                  <h3 className="font-display text-[1.12rem] font-medium tracking-[-0.01em] text-[var(--ink)]">
                    Ranked users{" "}
                    <em className="text-[0.88rem] font-light italic text-[var(--muted)]">
                      ({formatMetricNumber(sortedUsers.length, 0)})
                    </em>
                  </h3>
                  <div className="font-mono-ui text-[0.68rem] text-[var(--muted)]">
                    Sorted by{" "}
                    <b className="font-medium text-[var(--ink)]">
                      {sortLabels[sortState.key]}{" "}
                      {sortState.direction === "desc" ? "\u2193" : "\u2191"}
                    </b>{" "}
                    {"\u00B7 click header to change"}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="sticky top-0 whitespace-nowrap border-b border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3 text-left font-mono-ui text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
                          #
                        </th>
                        <SortableHead
                          active={sortState.key === "userId"}
                          direction={sortState.direction}
                          label="User ID"
                          onClick={() => handleSort("userId", setSortState, sortState)}
                        />
                        <SortableHead
                          active={sortState.key === "engagementScore"}
                          direction={sortState.direction}
                          label="Score"
                          onClick={() =>
                            handleSort("engagementScore", setSortState, sortState)
                          }
                        />
                        <th className="sticky top-0 whitespace-nowrap border-b border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3 text-left font-mono-ui text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
                          Region
                        </th>
                        <SortableHead
                          active={sortState.key === "sessionDurationSec"}
                          direction={sortState.direction}
                          label="Session (s)"
                          numeric
                          onClick={() =>
                            handleSort("sessionDurationSec", setSortState, sortState)
                          }
                        />
                        <SortableHead
                          active={sortState.key === "pagesViewed"}
                          direction={sortState.direction}
                          label="Pages"
                          numeric
                          onClick={() => handleSort("pagesViewed", setSortState, sortState)}
                        />
                        <SortableHead
                          active={sortState.key === "purchaseAmount"}
                          direction={sortState.direction}
                          label="Purchase"
                          numeric
                          onClick={() =>
                            handleSort("purchaseAmount", setSortState, sortState)
                          }
                        />
                        <th className="sticky top-0 whitespace-nowrap border-b border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3 text-left font-mono-ui text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.length === 0 ? (
                        <tr>
                          <td
                            className="px-6 py-16 text-center text-sm text-[var(--muted)]"
                            colSpan={8}
                          >
                            No users match this combination yet.
                          </td>
                        </tr>
                      ) : (
                        sortedUsers.map((user, index) => (
                          <LeaderboardRow
                            key={user.userId}
                            onOpen={() => setSelectedUserId(user.userId)}
                            rank={index + 1}
                            selected={selectedUserId === user.userId}
                            user={user}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section id="pipeline" className="mt-11">
              <PipelineStrip stages={snapshot.pipelineStages} />
            </section>
          </main>
        </div>
      </main>

      <UserDrawer onClose={() => setSelectedUserId(null)} user={selectedUser} />
    </>
  );
}

function buildSignalMatrixRows(
  snapshot: AnalyticsSnapshot,
  regionFilter: RegionFilter,
  regionScopedUsers: UserAnalyticsRecord[],
): SignalMatrixRow[] {
  const buildRow = (
    label: string,
    users: UserAnalyticsRecord[],
    regionId?: number,
  ): SignalMatrixRow => ({
    label,
    regionId,
    userCount: users.length,
    averageScore:
      users.length === 0
        ? 0
        : Number(
            (
              users.reduce((sum, user) => sum + user.engagementScore, 0) / users.length
            ).toFixed(3),
          ),
    values: matrixFeatureKeys.map((key) => {
      const contribution =
        users.length === 0
          ? 0
          : users.reduce((sum, user) => {
              const match = user.scoreBreakdown.find((part) => part.key === key);
              return sum + (match?.contribution ?? 0);
            }, 0) / users.length;

      return {
        key,
        shortLabel: signalShortLabels[key],
        contribution: Number(contribution.toFixed(3)),
      };
    }),
  });

  if (regionFilter === "all") {
    return snapshot.metadata.regionIds.map((regionId) =>
      buildRow(
        `Region ${regionId}`,
        snapshot.users.filter((user) => user.regionId === regionId),
        regionId,
      ),
    );
  }

  return [
    buildRow(`Region ${regionFilter}`, regionScopedUsers, regionFilter),
    buildRow("All regions", snapshot.users),
  ];
}

function buildInsightRows(users: UserAnalyticsRecord[], purchaseRate: number): InsightRow[] {
  const regionScores = [...new Set(users.map((user) => user.regionId))]
    .map((regionId) => {
      const scopedUsers = users.filter((user) => user.regionId === regionId);
      return {
        regionId,
        averageScore:
          scopedUsers.reduce((sum, user) => sum + user.engagementScore, 0) /
          Math.max(scopedUsers.length, 1),
        userCount: scopedUsers.length,
      };
    })
    .filter((region) => region.userCount > 0)
    .sort((left, right) => right.averageScore - left.averageScore);

  const topRegion = regionScores[0];
  const nextRegion = regionScores[1];
  const topSpender = [...users].sort(
    (left, right) => right.purchaseAmount - left.purchaseAmount,
  )[0];
  const topEngagement = [...users].sort(
    (left, right) => right.engagementScore - left.engagementScore,
  )[0];

  return [
    {
      kind: "Top region",
      tone: "flame",
      body: topRegion ? (
        <>
          <b>{getRegionMeta(topRegion.regionId).name}</b> leads on average engagement with{" "}
          <em>{topRegion.averageScore.toFixed(3)}</em>, ahead of{" "}
          {nextRegion ? getRegionMeta(nextRegion.regionId).code : "\u2014"} by{" "}
          {nextRegion
            ? (topRegion.averageScore - nextRegion.averageScore).toFixed(3)
            : "\u2014"}{" "}
          pts.
        </>
      ) : (
        <>No region currently has visible users.</>
      ),
      footLeft: topRegion ? `n = ${topRegion.userCount} users` : "\u2014",
      footRight: topRegion ? getRegionMeta(topRegion.regionId).code : "\u2014",
    },
    {
      kind: "Highest spender",
      tone: "forest",
      body: topSpender ? (
        <>
          <b>{formatUserCode(topSpender.userId)}</b> from{" "}
          {getRegionMeta(topSpender.regionId).name} drove{" "}
          <em>{formatCurrency(topSpender.purchaseAmount)}</em> in a single session.
        </>
      ) : (
        <>No purchase activity is visible in the current scope.</>
      ),
      footLeft: topSpender
        ? `${formatMetricNumber(topSpender.sessionDurationSec, 0)} sec session`
        : "\u2014",
      footRight: topSpender ? getRegionMeta(topSpender.regionId).code : "\u2014",
    },
    {
      kind: "Peak engagement",
      tone: "denim",
      body: topEngagement ? (
        <>
          <b>{formatUserCode(topEngagement.userId)}</b> scored{" "}
          <em>{topEngagement.engagementScore.toFixed(3)}</em>
          {" \u2014 "}
          {topEngagement.pagesViewed} pages in{" "}
          {formatMetricNumber(topEngagement.sessionDurationSec, 0)} sec.
        </>
      ) : (
        <>No engagement leader is visible in the current scope.</>
      ),
      footLeft: topEngagement
        ? `${formatMetricNumber(topEngagement.pagesPerSecond * 60, 1)} pages/min`
        : "\u2014",
      footRight: topEngagement ? getRegionMeta(topEngagement.regionId).code : "\u2014",
    },
    {
      kind: "Purchase conversion",
      tone: "ink",
      body: (
        <>
          <em>{formatPercent(purchaseRate)}</em> of visible users purchased{" "}
          {"\u2014 "}
          {purchaseRate > 0.4 ? "above" : "close to"} the population average.
        </>
      ),
      footLeft: `${users.filter((user) => user.purchaseFlag).length} of ${users.length}`,
      footRight: "CONV",
    },
  ];
}

function formatRegionLabel(regionCount: number) {
  const words = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
  ];
  const countLabel =
    regionCount >= 0 && regionCount < words.length ? words[regionCount] : String(regionCount);

  return `${countLabel} region${regionCount === 1 ? "" : "s"}`;
}

function getRatio(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.max(8, Math.min(100, (value / total) * 100));
}

function handleSort(
  key: SortKey,
  setSortState: Dispatch<SetStateAction<SortState>>,
  current: SortState,
) {
  startTransition(() => {
    setSortState(toggleSort(current, key));
  });
}

function RailSectionLabel({
  label,
  extraSpace = false,
}: {
  label: string;
  extraSpace?: boolean;
}) {
  return (
    <div className={`${extraSpace ? "mt-6" : "mt-7"} flex items-center gap-2`}>
      <span className="font-mono-ui text-[0.62rem] uppercase tracking-[0.2em] text-[var(--muted)]">
        {label}
      </span>
      <span className="h-px flex-1 bg-[var(--line-soft)]" />
    </div>
  );
}

function RailNavLink({
  href,
  label,
  index,
  active = false,
}: {
  href: string;
  label: string;
  index: string;
  active?: boolean;
}) {
  return (
    <a
      className={`flex items-center justify-between rounded-[6px] px-2.5 py-2 text-[0.84rem] transition ${
        active
          ? "bg-[var(--ink)] text-[var(--paper)]"
          : "text-[var(--ink-2)] hover:bg-[var(--paper-soft)] hover:text-[var(--ink)]"
      }`}
      href={href}
    >
      <span>{label}</span>
      <span
        className={`font-mono-ui text-[0.62rem] ${
          active ? "text-[var(--accent)]" : "text-[var(--muted)]"
        }`}
      >
        {index}
      </span>
    </a>
  );
}

function RegionChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-full border px-2.5 py-1.5 font-mono-ui text-[0.68rem] transition ${
        active
          ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--accent)]"
          : "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--ink-2)] hover:border-[var(--ink-3)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {active ? `\u2713 ${label}` : label}
    </button>
  );
}

function UtilityPill({ label, live = false }: { label: string; live?: boolean }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 ${
        live
          ? "border-[var(--forest)] text-[var(--forest)]"
          : "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--ink-2)]"
      }`}
    >
      {live ? (
        <span className="mr-1 inline-block h-[6px] w-[6px] rounded-full bg-[var(--forest)]" />
      ) : null}
      {label}
    </span>
  );
}

function HeroBadge({
  label,
  prefix,
  accent = false,
}: {
  label: string;
  prefix?: string;
  accent?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 font-mono-ui text-[0.62rem] tracking-[0.06em] ${
        accent
          ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[var(--dark)]"
          : "border-[var(--dark-line)] text-[#c9c1af]"
      }`}
    >
      {prefix ? <span className="mr-1 text-[#7a7263]">{prefix}</span> : null}
      {label}
    </span>
  );
}

function HeroMetricCard({
  label,
  value,
  delta,
  sub,
  down = false,
}: {
  label: string;
  value: string;
  delta: string;
  sub: string;
  down?: boolean;
}) {
  return (
    <div className="bg-[var(--dark)] px-5 py-4">
      <div className="font-mono-ui text-[0.62rem] uppercase tracking-[0.16em] text-[#8f8777]">
        {label}
      </div>
      <div className="mt-2 font-display text-[2.35rem] font-normal leading-none tracking-[-0.03em] text-[var(--paper)]">
        {value}
      </div>
      <div className="mt-2 font-mono-ui text-[0.65rem] text-[#8f8777]">
        <span className={down ? "text-[var(--flame)]" : "text-[var(--accent)]"}>{delta}</span>{" "}
        {sub}
      </div>
    </div>
  );
}

function HeroLeaderRow({
  user,
  rank,
  onOpen,
}: {
  user: UserAnalyticsRecord;
  rank: number;
  onOpen: () => void;
}) {
  const region = getRegionMeta(user.regionId);

  return (
    <button
      className="grid w-full grid-cols-[24px_1fr_auto] items-center gap-2 bg-[var(--dark-2)] px-3 py-3 text-left transition hover:bg-[var(--dark-3)] sm:grid-cols-[28px_1fr_auto_auto] sm:px-4"
      onClick={onOpen}
      type="button"
    >
      <div className="font-mono-ui text-[0.62rem] text-[var(--accent)]">
        {String(rank).padStart(2, "0")}
      </div>
      <div className="font-mono-ui text-[0.76rem] text-[var(--paper)]">
        {formatUserCode(user.userId)}
      </div>
      <div
        className="hidden rounded-full border border-[var(--dark-line)] px-2 py-0.5 font-mono-ui text-[0.6rem] sm:block"
        style={{ color: region.color }}
      >
        {region.code}
      </div>
      <div className="min-w-[44px] text-right font-display text-[1rem] font-medium tracking-[-0.02em] text-[var(--accent)]">
        {user.engagementScore.toFixed(3)}
      </div>
    </button>
  );
}

function SectionHeader({
  index,
  title,
  subtitle,
  description,
}: {
  index: string;
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-baseline lg:justify-between">
      <div className="flex items-baseline gap-3">
        <span className="font-mono-ui text-[0.68rem] text-[var(--muted)]">{index}</span>
        <h2 className="font-display text-[1.35rem] font-normal tracking-[-0.02em] text-[var(--ink)] sm:text-[1.7rem]">
          {title}{" "}
          <em className="block pt-0.5 font-light italic text-[var(--ink-3)] sm:inline sm:pt-0">{`\u2014 ${subtitle}`}</em>
        </h2>
      </div>
      <div className="max-w-[420px] text-sm leading-6 text-[var(--muted)] lg:text-right">
        {description}
      </div>
    </div>
  );
}

function SnapshotItem({
  label,
  value,
  barWidth,
  accent = false,
}: {
  label: string;
  value: string;
  barWidth: number;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="font-mono-ui text-[0.62rem] uppercase tracking-[0.1em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-1.5 font-display text-[1.7rem] font-medium leading-none tracking-[-0.03em] text-[var(--ink)]">
        {value}
      </div>
      <div className="mt-2 h-[3px] overflow-hidden rounded-[2px] bg-[var(--paper-deep)]">
        <i
          className={`block h-full ${accent ? "bg-[var(--flame)]" : "bg-[var(--ink)]"}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: InsightRow }) {
  const dotColor =
    insight.tone === "flame"
      ? "var(--flame)"
      : insight.tone === "forest"
        ? "var(--forest)"
        : insight.tone === "denim"
          ? "var(--denim)"
          : "var(--ink)";

  return (
    <article className="flex min-h-[128px] flex-col rounded-[14px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-4 transition hover:-translate-y-[2px] hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 font-mono-ui text-[0.62rem] uppercase tracking-[0.14em] text-[var(--muted)]">
        <span
          className="inline-block h-[6px] w-[6px] rounded-full"
          style={{ backgroundColor: dotColor }}
        />
        {insight.kind}
      </div>
      <div className="mt-3 flex-1 font-display text-[1.05rem] font-normal leading-[1.3] tracking-[-0.01em] text-[var(--ink-2)] [&_b]:font-semibold [&_b]:text-[var(--ink)] [&_em]:rounded-[2px] [&_em]:bg-[var(--accent)] [&_em]:px-1 [&_em]:font-normal [&_em]:italic">
        {insight.body}
      </div>
      <div className="mt-3 flex items-center justify-between font-mono-ui text-[0.68rem] text-[var(--muted)]">
        <span>{insight.footLeft}</span>
        <b className="font-medium text-[var(--ink-2)]">{insight.footRight}</b>
      </div>
    </article>
  );
}

function KpiCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: { up: boolean; value: string; label: string; spark: number[] };
}) {
  return (
    <div className="border-b border-[var(--line-soft)] px-5 py-5 md:border-r xl:border-b-0 xl:last:border-r-0">
      <div className="font-mono-ui text-[0.62rem] uppercase tracking-[0.16em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2.5 font-display text-[2.3rem] font-normal leading-none tracking-[-0.035em] text-[var(--ink)]">
        {value}
      </div>
      <Sparkline data={trend.spark} />
      <div className="mt-2 flex justify-between font-mono-ui text-[0.68rem] text-[var(--muted)]">
        <span className={trend.up ? "text-[var(--forest)]" : "text-[var(--claret)]"}>
          {trend.up ? "\u25B2" : "\u25BC"} {trend.value}
        </span>
        <span>{trend.label}</span>
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const width = 200;
  const height = 26;
  const padding = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = padding + index * ((width - padding * 2) / (data.length - 1));
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastPoint = points.split(" ").at(-1)?.split(",") ?? ["0", "0"];

  return (
    <svg
      className="mt-2 block h-[26px] w-full"
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline fill="none" points={points} stroke="var(--ink)" strokeWidth="1.4" />
      <circle cx={lastPoint[0]} cy={lastPoint[1]} fill="var(--flame)" r="2.2" />
    </svg>
  );
}

function MatrixCell({ value, matrixMax }: { value: number; matrixMax: number }) {
  const intensity = Math.abs(value) / matrixMax;
  const background =
    value >= 0
      ? `rgba(229, 85, 43, ${0.08 + intensity * 0.55})`
      : `rgba(46, 78, 111, ${0.08 + intensity * 0.55})`;

  return (
    <td className="border-b border-[var(--line-soft)] px-3 py-3 text-center">
      <span
        className="inline-block min-w-[64px] rounded-[6px] px-2.5 py-1.5 font-mono-ui text-[0.76rem] font-medium text-[var(--ink)]"
        style={{ background }}
      >
        {value.toFixed(3)}
      </span>
      <span className="mt-1 block h-[3px] overflow-hidden rounded-[2px] bg-[rgba(0,0,0,0.12)]">
        <i className="block h-full bg-[var(--ink)]" style={{ width: `${intensity * 100}%` }} />
      </span>
    </td>
  );
}

function SupportTile({
  label,
  value,
  foot,
  dark = false,
}: {
  label: string;
  value: string;
  foot: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border px-5 py-4 ${
        dark
          ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
          : "border-[var(--line)] bg-[var(--surface-strong)]"
      }`}
    >
      <div
        className={`font-mono-ui text-[0.62rem] uppercase tracking-[0.16em] ${
          dark ? "text-[#8f8777]" : "text-[var(--muted)]"
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-2 font-display text-[2.35rem] font-normal leading-none tracking-[-0.03em] ${
          dark ? "text-[var(--paper)]" : "text-[var(--ink)]"
        }`}
      >
        {dark ? <em className="not-italic text-[var(--accent)]">{value}</em> : value}
      </div>
      <div
        className={`mt-2 font-mono-ui text-[0.68rem] ${
          dark ? "text-[#8f8777]" : "text-[var(--muted)]"
        }`}
      >
        {foot}
      </div>
    </div>
  );
}

function SortableHead({
  label,
  onClick,
  active,
  direction,
  numeric = false,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  direction: "asc" | "desc";
  numeric?: boolean;
}) {
  return (
    <th
      className={`sticky top-0 whitespace-nowrap border-b border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3 ${
        numeric ? "text-right" : "text-left"
      } font-mono-ui text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[var(--muted)]`}
    >
      <button
        className="inline-flex items-center gap-1 hover:text-[var(--ink)]"
        onClick={onClick}
        type="button"
      >
        <span>{label}</span>
        <span className={active ? "text-[var(--flame)] opacity-100" : "opacity-40"}>
          {active ? (direction === "desc" ? "\u25BC" : "\u25B2") : ""}
        </span>
      </button>
    </th>
  );
}

function LeaderboardRow({
  user,
  selected,
  onOpen,
  rank,
}: {
  user: UserAnalyticsRecord;
  selected: boolean;
  onOpen: () => void;
  rank: number;
}) {
  const region = getRegionMeta(user.regionId);
  const isHighValue = user.purchaseAmount > 100;

  return (
    <tr
      aria-label={`Open details for user ${user.userId}`}
      className={`cursor-pointer text-sm transition hover:bg-[var(--paper-soft)] ${
        selected ? "bg-[rgba(216,246,81,0.14)]" : ""
      }`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <td className="border-b border-[var(--line-soft)] px-4 py-3 font-mono-ui text-[0.68rem] text-[var(--muted)]">
        {String(rank).padStart(2, "0")}
      </td>
      <td className="border-b border-[var(--line-soft)] px-4 py-3 font-mono-ui text-[0.78rem] text-[var(--ink)]">
        {formatUserCode(user.userId)}
      </td>
      <td
        className={`border-b border-[var(--line-soft)] px-4 py-3 text-right font-display text-[1rem] font-medium tracking-[-0.02em] ${
          isHighValue ? "text-[var(--flame)]" : "text-[var(--ink)]"
        }`}
      >
        {user.engagementScore.toFixed(3)}
        <span className="ml-2 inline-block h-[4px] w-[80px] translate-y-[-1px] overflow-hidden rounded-[2px] bg-[var(--paper-deep)] align-middle">
          <i
            className={`block h-full ${isHighValue ? "bg-[var(--flame)]" : "bg-[var(--ink)]"}`}
            style={{ width: `${Math.min(100, user.engagementScore * 10)}%` }}
          />
        </span>
      </td>
      <td className="border-b border-[var(--line-soft)] px-4 py-3 font-mono-ui text-[0.68rem]">
        <span
          className="mr-1.5 inline-block h-[8px] w-[8px] rounded-[2px]"
          style={{ backgroundColor: region.color }}
        />
        {region.code}
      </td>
      <td className="border-b border-[var(--line-soft)] px-4 py-3 text-right font-mono-ui text-[0.72rem]">
        {formatMetricNumber(user.sessionDurationSec, 0)}
      </td>
      <td className="border-b border-[var(--line-soft)] px-4 py-3 text-right font-mono-ui text-[0.72rem]">
        {formatMetricNumber(user.pagesViewed, 0)}
      </td>
      <td className="border-b border-[var(--line-soft)] px-4 py-3 text-right font-mono-ui text-[0.72rem]">
        {user.purchaseAmount > 0 ? formatCurrency(user.purchaseAmount) : "\u2014"}
      </td>
      <td className="border-b border-[var(--line-soft)] px-4 py-3 text-center">
        <span
          className={`inline-block rounded-full px-2.5 py-1 font-mono-ui text-[0.62rem] tracking-[0.08em] ${
            user.purchaseFlag
              ? "bg-[var(--accent)] text-[var(--ink)]"
              : "bg-[var(--paper-deep)] text-[var(--muted)]"
          }`}
        >
          {user.purchaseFlag ? "PURCHASED" : "VIEW"}
        </span>
      </td>
    </tr>
  );
}
