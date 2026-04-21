import snapshot from "@/data/analytics-snapshot.json";
import { DashboardShell } from "@/components/dashboard-shell";
import type { AnalyticsSnapshot } from "@/lib/types";

const typedSnapshot = snapshot as AnalyticsSnapshot;

export default function HomePage() {
  return <DashboardShell snapshot={typedSnapshot} />;
}
