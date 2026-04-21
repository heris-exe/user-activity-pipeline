import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildAnalyticsSnapshotFromCsvText } from "@/lib/analytics-builder";

const testFilePath = fileURLToPath(import.meta.url);
const workspaceRoot = path.resolve(path.dirname(testFilePath), "..");

test("analytics snapshot matches notebook-level metrics", async () => {
  const csvText = await readFile(path.join(workspaceRoot, "user_events.csv"), "utf8");
  const snapshot = buildAnalyticsSnapshotFromCsvText(csvText, "user_events.csv");

  assert.equal(snapshot.metadata.totalUsers, 500);
  assert.equal(snapshot.metadata.totalRevenue, 7573.13);
  assert.equal(snapshot.metadata.averageSessionSec, 493.62);
  assert.equal(snapshot.metadata.highValueUsers, 24);
  assert.deepEqual(snapshot.metadata.regionIds, [0, 1, 2, 3, 4]);
  assert.deepEqual(snapshot.metadata.topUserIds, [376, 109, 180, 479, 375]);
  assert.equal(snapshot.users.length, 500);
});
