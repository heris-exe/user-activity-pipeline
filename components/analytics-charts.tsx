"use client";

import type { ReactNode } from "react";

import { formatMetricNumber, getRegionMeta } from "@/lib/dashboard-utils";
import type { RegionFilter } from "@/lib/dashboard-utils";
import type { UserAnalyticsRecord } from "@/lib/types";

interface EngagementScatterCardProps {
  users: UserAnalyticsRecord[];
  allUsers: UserAnalyticsRecord[];
  className?: string;
  height?: number;
  onSelectUser?: (userId: number) => void;
}

interface RevenueChartCardProps {
  users: UserAnalyticsRecord[];
  regionIds: number[];
  activeRegionFilter: RegionFilter;
  className?: string;
  height?: number;
}

interface ScoreDistributionCardProps {
  users: UserAnalyticsRecord[];
  className?: string;
  height?: number;
}

export function EngagementScatterCard({
  users,
  allUsers,
  className,
  height = 340,
  onSelectUser,
}: EngagementScatterCardProps) {
  const width = 620;
  const svgHeight = Math.max(300, Math.round(height));
  const left = 46;
  const right = 14;
  const top = 16;
  const bottom = 36;
  const xMax = Math.max(...allUsers.map((user) => user.sessionDurationSec), 1);
  const yMax = Math.max(...allUsers.map((user) => user.pagesViewed), 1);
  const rMax = Math.max(...allUsers.map((user) => user.purchaseAmount), 1);

  const x = (value: number) => left + (value / xMax) * (width - left - right);
  const y = (value: number) =>
    svgHeight - bottom - (value / yMax) * (svgHeight - top - bottom);
  const radius = (value: number) => 3 + (value / rMax) * 8;

  const horizontalGrid = Array.from({ length: 6 }, (_, index) => {
    const yValue = top + index * ((svgHeight - top - bottom) / 5);
    const axisValue = Math.round(yMax * (1 - index / 5));
    return { yValue, axisValue };
  });

  const verticalTicks = Array.from({ length: 6 }, (_, index) => {
    const xValue = left + index * ((width - left - right) / 5);
    const axisValue = Math.round((xMax * index) / 5);
    return { xValue, axisValue };
  });

  return (
    <ChartCard
      className={className}
      meta={`n = ${formatMetricNumber(users.length, 0)}`}
      title={
        <>
          Session {"\u00D7"} Pages{" "}
          <em className="font-light italic text-[var(--muted)]">
            {"\u2014"} engagement intensity
          </em>
        </>
      }
    >
      <svg
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${width} ${svgHeight}`}
      >
        <g>
          {horizontalGrid.map((row) => (
            <line
              key={`grid-y-${row.yValue}`}
              stroke="var(--line-soft)"
              strokeDasharray="2 3"
              x1={left}
              x2={width - right}
              y1={row.yValue}
              y2={row.yValue}
            />
          ))}
        </g>

        <g>
          <line
            stroke="var(--line)"
            x1={left}
            x2={width - right}
            y1={svgHeight - bottom}
            y2={svgHeight - bottom}
          />
          <line stroke="var(--line)" x1={left} x2={left} y1={top} y2={svgHeight - bottom} />

          {horizontalGrid.map((row) => (
            <text
              key={`axis-y-${row.yValue}`}
              fill="var(--muted)"
              fontFamily="var(--font-mono), monospace"
              fontSize="9.5"
              textAnchor="end"
              x={left - 8}
              y={row.yValue + 3}
            >
              {row.axisValue}
            </text>
          ))}

          {verticalTicks.map((tick) => (
            <text
              key={`axis-x-${tick.xValue}`}
              fill="var(--muted)"
              fontFamily="var(--font-mono), monospace"
              fontSize="9.5"
              textAnchor="middle"
              x={tick.xValue}
              y={svgHeight - bottom + 16}
            >
              {tick.axisValue}
            </text>
          ))}

          <text
            fill="var(--muted)"
            fontFamily="var(--font-mono), monospace"
            fontSize="10"
            textAnchor="end"
            x={width - right}
            y={svgHeight - 6}
          >
            {"session (sec) \u2192"}
          </text>
          <text
            fill="var(--muted)"
            fontFamily="var(--font-mono), monospace"
            fontSize="10"
            x={left - 34}
            y={top + 4}
          >
            {"\u2191 pages"}
          </text>
        </g>

        <g>
          {users.map((user) => {
            const isPurchaser = user.purchaseAmount > 0;
            const region = getRegionMeta(user.regionId);
            const circleRadius = isPurchaser ? radius(user.purchaseAmount) : 3;

            return (
              <circle
                key={`dot-${user.userId}`}
                className={onSelectUser ? "cursor-pointer" : undefined}
                cx={x(user.sessionDurationSec)}
                cy={y(user.pagesViewed)}
                fill={isPurchaser ? "var(--flame)" : "transparent"}
                fillOpacity={isPurchaser ? 0.35 : 1}
                onClick={
                  onSelectUser
                    ? () => {
                        onSelectUser(user.userId);
                      }
                    : undefined
                }
                r={circleRadius}
                stroke={isPurchaser ? "var(--flame)" : "var(--ink-3)"}
                strokeWidth={1.4}
              >
                <title>{`${region.code} \u00B7 User ${user.userId}`}</title>
              </circle>
            );
          })}
        </g>
      </svg>

      <div className="mt-2 flex flex-wrap gap-4 font-mono-ui text-[0.66rem] text-[var(--muted)]">
        <span className="inline-flex items-center gap-2">
          <i className="inline-block h-[10px] w-[10px] rounded-full bg-[var(--flame)]" />
          purchaser
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="inline-block h-[10px] w-[10px] rounded-full border border-[var(--ink-3)]" />
          non-purchaser
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="inline-block h-[10px] w-[10px] rounded-full border border-[var(--ink)] bg-[var(--accent)]" />
          {"dot \u221D revenue"}
        </span>
      </div>
    </ChartCard>
  );
}

export function RevenueChartCard({
  users,
  regionIds,
  activeRegionFilter,
  className,
  height = 340,
}: RevenueChartCardProps) {
  const width = 420;
  const svgHeight = Math.max(300, Math.round(height));
  const left = 46;
  const right = 18;
  const top = 16;
  const bottom = 60;

  const rows = regionIds.map((regionId) => {
    const region = getRegionMeta(regionId);
    const scopedUsers = users.filter((user) => user.regionId === regionId);
    return {
      regionId,
      region,
      revenue: scopedUsers.reduce((sum, user) => sum + user.purchaseAmount, 0),
      userCount: scopedUsers.length,
    };
  });

  const maxRevenue = Math.max(1, ...rows.map((row) => row.revenue));
  const bandWidth = (width - left - right) / Math.max(rows.length, 1);

  return (
    <ChartCard className={className} meta="USD" title="Revenue by region">
      <svg
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${width} ${svgHeight}`}
      >
        <g>
          {Array.from({ length: 5 }, (_, index) => {
            const yValue = top + index * ((svgHeight - top - bottom) / 4);
            const labelValue = maxRevenue * (1 - index / 4);
            return (
              <g key={`revenue-grid-${index}`}>
                <line
                  stroke="var(--line-soft)"
                  strokeDasharray="2 3"
                  x1={left}
                  x2={width - right}
                  y1={yValue}
                  y2={yValue}
                />
                <text
                  fill="var(--muted)"
                  fontFamily="var(--font-mono), monospace"
                  fontSize="9.5"
                  textAnchor="end"
                  x={left - 8}
                  y={yValue + 3}
                >
                  {formatCompactCurrency(labelValue)}
                </text>
              </g>
            );
          })}
        </g>

        <line
          stroke="var(--line)"
          x1={left}
          x2={width - right}
          y1={svgHeight - bottom}
          y2={svgHeight - bottom}
        />

        {rows.map((row, index) => {
          const barHeight = (row.revenue / maxRevenue) * (svgHeight - top - bottom);
          const xValue = left + index * bandWidth + 10;
          const yValue = svgHeight - bottom - barHeight;
          const active =
            activeRegionFilter === "all" || activeRegionFilter === row.regionId;

          return (
            <g key={`revenue-bar-${row.regionId}`}>
              <rect
                fill={active ? row.region.color : "var(--paper-deep)"}
                height={barHeight}
                opacity={active ? 1 : 0.6}
                rx={3}
                width={bandWidth - 20}
                x={xValue}
                y={yValue}
              />
              <text
                fill={active ? row.region.color : "var(--muted)"}
                fontFamily="var(--font-mono), monospace"
                fontSize="10"
                textAnchor="middle"
                x={xValue + (bandWidth - 20) / 2}
                y={yValue - 6}
              >
                {formatCompactCurrency(row.revenue)}
              </text>
              <text
                fill="var(--ink-2)"
                fontFamily="var(--font-mono), monospace"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
                x={xValue + (bandWidth - 20) / 2}
                y={svgHeight - bottom + 16}
              >
                {row.region.code}
              </text>
              <text
                fill="var(--muted)"
                fontSize="9"
                textAnchor="middle"
                x={xValue + (bandWidth - 20) / 2}
                y={svgHeight - bottom + 30}
              >
                {`${row.userCount} users`}
              </text>
            </g>
          );
        })}
      </svg>
    </ChartCard>
  );
}

export function ScoreDistributionCard({
  users,
  className,
  height = 340,
}: ScoreDistributionCardProps) {
  const width = 420;
  const svgHeight = Math.max(300, Math.round(height));
  const left = 40;
  const right = 18;
  const top = 16;
  const bottom = 40;
  const bins = 10;
  const minScore = Math.min(...users.map((user) => user.engagementScore), 0);
  const maxScore = Math.max(...users.map((user) => user.engagementScore), 0.001);
  const chartMin = Math.floor(minScore);
  const chartMax = Math.ceil(Math.max(10, maxScore));
  const scoreRange = Math.max(chartMax - chartMin, 0.001);
  const threshold = chartMin + scoreRange * 0.7;
  const counts = new Array<number>(bins).fill(0);

  users.forEach((user) => {
    const index = Math.min(
      bins - 1,
      Math.max(0, Math.floor(((user.engagementScore - chartMin) / scoreRange) * bins)),
    );
    counts[index] += 1;
  });

  const maxCount = Math.max(1, ...counts);
  const bandWidth = (width - left - right) / bins;
  const thresholdIndex = Math.min(
    bins - 1,
    Math.max(0, Math.floor(((threshold - chartMin) / scoreRange) * bins)),
  );
  const thresholdX = left + thresholdIndex * bandWidth;

  return (
    <ChartCard className={className} meta="bins of 10" title="Score distribution">
      <svg
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${width} ${svgHeight}`}
      >
        <g>
          {Array.from({ length: 5 }, (_, index) => {
            const yValue = top + index * ((svgHeight - top - bottom) / 4);
            const labelValue = Math.round(maxCount * (1 - index / 4));
            return (
              <g key={`hist-grid-${index}`}>
                <line
                  stroke="var(--line-soft)"
                  strokeDasharray="2 3"
                  x1={left}
                  x2={width - right}
                  y1={yValue}
                  y2={yValue}
                />
                <text
                  fill="var(--muted)"
                  fontFamily="var(--font-mono), monospace"
                  fontSize="9.5"
                  textAnchor="end"
                  x={left - 6}
                  y={yValue + 3}
                >
                  {labelValue}
                </text>
              </g>
            );
          })}
        </g>

        <rect
          fill="var(--accent)"
          height={svgHeight - top - bottom}
          opacity={0.1}
          width={width - right - thresholdX}
          x={thresholdX}
          y={top}
        />
        <line
          stroke="var(--flame)"
          strokeDasharray="3 3"
          strokeWidth={1}
          x1={thresholdX}
          x2={thresholdX}
          y1={top}
          y2={svgHeight - bottom}
        />
        <text
          fill="var(--flame)"
          fontFamily="var(--font-mono), monospace"
          fontSize="9.5"
          fontWeight="600"
          x={thresholdX + 4}
          y={top + 12}
        >
          {`HIGH BAND >= ${formatMetricNumber(threshold, 1)}`}
        </text>

        <line
          stroke="var(--line)"
          x1={left}
          x2={width - right}
          y1={svgHeight - bottom}
          y2={svgHeight - bottom}
        />

        {counts.map((count, index) => {
          const barHeight = (count / maxCount) * (svgHeight - top - bottom);
          const xValue = left + index * bandWidth + 3;
          const yValue = svgHeight - bottom - barHeight;
          const startValue = chartMin + (scoreRange / bins) * index;
          const isHighBand = index >= thresholdIndex;

          return (
            <g key={`hist-bar-${index}`}>
              <rect
                fill={isHighBand ? "var(--flame)" : "var(--ink)"}
                height={barHeight}
                opacity={0.92}
                rx={2}
                width={bandWidth - 6}
                x={xValue}
                y={yValue}
              />
              {count > 0 ? (
                <text
                  fill="var(--ink-2)"
                  fontFamily="var(--font-mono), monospace"
                  fontSize="9.5"
                  fontWeight="600"
                  textAnchor="middle"
                  x={xValue + (bandWidth - 6) / 2}
                  y={yValue - 4}
                >
                  {count}
                </text>
              ) : null}
              <text
                fill="var(--muted)"
                fontFamily="var(--font-mono), monospace"
                fontSize="9"
                textAnchor="middle"
                x={xValue + (bandWidth - 6) / 2}
                y={svgHeight - bottom + 14}
              >
                {formatMetricNumber(startValue, 1)}
              </text>
            </g>
          );
        })}

        <text
          fill="var(--muted)"
          fontFamily="var(--font-mono), monospace"
          fontSize="10"
          textAnchor="end"
          x={width - right}
          y={svgHeight - 4}
        >
          {"score \u2192"}
        </text>
      </svg>
    </ChartCard>
  );
}

function ChartCard({
  title,
  meta,
  children,
  className,
}: {
  title: ReactNode;
  meta: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[14px] border border-[var(--line)] bg-[var(--surface-strong)] px-5 pb-4 pt-4 ${className ?? ""}`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-[1.12rem] font-medium tracking-[-0.01em] text-[var(--ink)]">
          {title}
        </h3>
        <div className="font-mono-ui text-[0.62rem] uppercase tracking-[0.1em] text-[var(--muted)]">
          {meta}
        </div>
      </div>
      {children}
    </section>
  );
}

function formatCompactCurrency(value: number) {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }

  return `$${formatMetricNumber(value, 0)}`;
}
