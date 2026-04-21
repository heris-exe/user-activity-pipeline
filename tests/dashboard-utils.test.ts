import assert from "node:assert/strict";
import test from "node:test";

import snapshot from "@/data/analytics-snapshot.json";
import {
  buildSelectionMetrics,
  filterUsers,
  getScoreDistribution,
  getSelectedUser,
  getTopUsers,
  getRegionScopedUsers,
  sortUsers,
  toggleSort,
} from "@/lib/dashboard-utils";
import type { AnalyticsSnapshot } from "@/lib/types";

const typedSnapshot = snapshot as AnalyticsSnapshot;

test("region filtering scopes the analytics set correctly", () => {
  const regionUsers = getRegionScopedUsers(typedSnapshot.users, 3);

  assert.equal(regionUsers.every((user) => user.regionId === 3), true);
  assert.equal(regionUsers.length, 81);
});

test("search and sorting work together for the leaderboard table", () => {
  const searched = filterUsers(typedSnapshot.users, "all", "37");
  const sorted = sortUsers(searched, { key: "engagementScore", direction: "desc" });

  assert.equal(sorted.length > 0, true);
  assert.equal(String(sorted[0].userId).includes("37"), true);
  assert.equal(sorted[0].engagementScore >= sorted[sorted.length - 1].engagementScore, true);
});

test("empty-state searches collapse cleanly", () => {
  const searched = filterUsers(typedSnapshot.users, 4, "99999");
  const metrics = buildSelectionMetrics(searched);
  const distribution = getScoreDistribution(searched);

  assert.equal(searched.length, 0);
  assert.equal(metrics.totalUsers, 0);
  assert.deepEqual(distribution, []);
});

test("drawer selection and top-user helpers stay aligned", () => {
  const topUser = getTopUsers(typedSnapshot.users, 1)[0];
  const selected = getSelectedUser(typedSnapshot.users, topUser.userId);

  assert.equal(selected?.userId, 376);
  assert.deepEqual(toggleSort({ key: "engagementScore", direction: "desc" }, "engagementScore"), {
    key: "engagementScore",
    direction: "asc",
  });
});
