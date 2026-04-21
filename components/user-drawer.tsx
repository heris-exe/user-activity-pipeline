"use client";

import { useEffect, useEffectEvent } from "react";

import {
  formatCurrency,
  formatMetricNumber,
  formatUserCode,
  getRegionMeta,
} from "@/lib/dashboard-utils";
import type { UserAnalyticsRecord } from "@/lib/types";

interface UserDrawerProps {
  user: UserAnalyticsRecord | null;
  onClose: () => void;
}

export function UserDrawer({ user, onClose }: UserDrawerProps) {
  const handleKeydown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  });

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const listener = (event: KeyboardEvent) => handleKeydown(event);
    window.addEventListener("keydown", listener);

    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [user]);

  if (!user) {
    return null;
  }

  const region = getRegionMeta(user.regionId);
  const contributionTotal = user.scoreBreakdown.reduce(
    (sum, item) => sum + Math.abs(item.contribution),
    0,
  );

  const contributionRows = [
    { key: "purchase", label: "purchase", color: "var(--flame)" },
    { key: "normalizedSessionDuration", label: "session_dur", color: "var(--gold)" },
    { key: "normalizedPagesViewed", label: "pages_viewed", color: "var(--forest)" },
    { key: "pagesPerSecond", label: "pages_per_sec", color: "var(--denim)" },
  ]
    .map((entry) => {
      const match = user.scoreBreakdown.find((item) => item.key === entry.key);
      return {
        ...entry,
        contribution: match?.contribution ?? 0,
      };
    })
    .sort((left, right) => right.contribution - left.contribution);

  return (
    <>
      <button
        aria-label="Close user detail drawer"
        className="fixed inset-0 z-[100] bg-[rgba(11,10,9,0.4)] opacity-100 backdrop-blur-[1px]"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-hidden="false"
        aria-label={`User detail for ${user.userId}`}
        className="fixed inset-y-0 right-0 z-[110] flex w-full max-w-[520px] flex-col border-l border-[var(--line)] bg-[var(--paper)] shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.25)]"
        role="dialog"
      >
        <div className="flex items-start justify-between bg-[var(--ink)] px-6 py-5 text-[var(--paper)]">
          <div>
            <div className="font-mono-ui text-[0.62rem] uppercase tracking-[0.2em] text-[var(--accent)]">
              {"User detail \u00B7 explainability"}
            </div>
            <div className="mt-1 font-display text-[2rem] font-medium tracking-[-0.02em]">
              {formatUserCode(user.userId)}
            </div>
            <div className="mt-1 font-mono-ui text-[0.68rem] text-[#8f8777]">
              <span style={{ color: region.color }}>{region.name}</span>
              {" \u00B7 "}
              {region.code}
            </div>
          </div>
          <button
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-[8px] border border-[var(--dark-line)] bg-[var(--dark-2)] font-mono-ui text-sm text-[var(--paper)] transition hover:bg-[var(--dark-3)]"
            onClick={onClose}
            type="button"
          >
            {"\u2715"}
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="mb-6 rounded-[14px] bg-[var(--ink)] px-5 py-5 text-[var(--paper)]">
            <div className="grid grid-cols-[auto_1fr] items-center gap-5">
              <div className="font-display text-[3.8rem] font-normal leading-none tracking-[-0.04em] text-[var(--accent)]">
                {user.engagementScore.toFixed(3)}
              </div>
              <div>
                <div className="font-mono-ui text-[0.62rem] uppercase tracking-[0.2em] text-[#8f8777]">
                  Engagement score
                </div>
                <div className="mt-1 font-display text-[1.05rem] font-medium">
                  {user.purchaseAmount > 100
                    ? "High-value user"
                    : user.engagementScore >= 0.55
                      ? "Engaged user"
                      : "Developing user"}
                </div>
                <div className="mt-1 font-mono-ui text-[0.68rem] text-[#8f8777]">
                  {"weighted output \u00B7 purchase status "}
                  {user.purchaseStatus.toLowerCase()}
                </div>
              </div>
            </div>
          </div>

          <DrawerSection title="Raw metrics">
            <div className="grid grid-cols-2 gap-3">
              <MetricBox
                label="Session duration"
                raw="sessionDurationSec"
                value={`${formatMetricNumber(user.sessionDurationSec, 1)} sec`}
              />
              <MetricBox
                label="Pages viewed"
                raw="pagesViewed"
                value={formatMetricNumber(user.pagesViewed, 0)}
              />
              <MetricBox
                label="Pages / second"
                raw={"derived \u00B7 velocity"}
                value={formatMetricNumber(user.pagesPerSecond, 4)}
              />
              <MetricBox
                label="Purchase amount"
                raw={"purchaseAmount \u00B7 USD"}
                value={formatCurrency(user.purchaseAmount)}
              />
            </div>
          </DrawerSection>

          <DrawerSection title="Normalized features">
            <div className="space-y-1">
              <NormRow
                keyLabel="session_n"
                normalized={user.normalizedSessionDuration}
                raw={formatMetricNumber(user.sessionDurationSec, 1)}
              />
              <NormRow
                keyLabel="pages_n"
                normalized={user.normalizedPagesViewed}
                raw={formatMetricNumber(user.pagesViewed, 0)}
              />
              <NormRow
                keyLabel="pps_n"
                normalized={user.pagesPerSecond}
                raw={formatMetricNumber(user.pagesPerSecond, 4)}
              />
              <NormRow
                keyLabel="purchase_n"
                normalized={user.normalizedPurchaseAmount}
                raw={formatMetricNumber(user.purchaseAmount, 2)}
              />
            </div>
          </DrawerSection>

          <DrawerSection title="Score contribution breakdown">
            <div className="flex flex-col gap-3">
              {contributionRows.map((item) => {
                const width =
                  contributionTotal === 0
                    ? 0
                    : (Math.abs(item.contribution) / contributionTotal) * 100;

                return (
                  <div
                    key={item.label}
                    className="grid grid-cols-[110px_1fr_58px] items-center gap-3"
                  >
                    <div className="font-mono-ui text-[0.68rem] text-[var(--ink-2)]">
                      {item.label}
                    </div>
                    <div className="h-[10px] overflow-hidden rounded-[4px] bg-[var(--paper-deep)]">
                      <i
                        className="block h-full rounded-[4px]"
                        style={{ backgroundColor: item.color, width: `${width}%` }}
                      />
                    </div>
                    <div className="text-right font-mono-ui text-[0.72rem] text-[var(--ink)]">
                      +{item.contribution.toFixed(4)}
                    </div>
                  </div>
                );
              })}
            </div>
          </DrawerSection>
        </div>
      </aside>
    </>
  );
}

function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h4 className="mb-3 flex items-center gap-2 font-mono-ui text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
        <span>{title}</span>
        <span className="h-px flex-1 bg-[var(--line)]" />
      </h4>
      {children}
    </section>
  );
}

function MetricBox({
  label,
  value,
  raw,
}: {
  label: string;
  value: string;
  raw: string;
}) {
  return (
    <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
      <div className="font-mono-ui text-[0.62rem] uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-1 font-display text-[1.35rem] font-medium tracking-[-0.02em] text-[var(--ink)]">
        {value}
      </div>
      <div className="mt-1 font-mono-ui text-[0.65rem] text-[var(--muted)]">{raw}</div>
    </div>
  );
}

function NormRow({
  keyLabel,
  raw,
  normalized,
}: {
  keyLabel: string;
  raw: string;
  normalized: number;
}) {
  return (
    <div className="grid grid-cols-[1fr_50px_58px] gap-3 border-b border-dashed border-[var(--line-soft)] py-2 font-mono-ui text-[0.68rem] last:border-b-0">
      <span className="text-[var(--muted)]">{keyLabel}</span>
      <span className="text-right text-[var(--ink)]">{raw}</span>
      <span className="text-right font-semibold text-[var(--flame)]">
        {normalized.toFixed(3)}
      </span>
    </div>
  );
}
