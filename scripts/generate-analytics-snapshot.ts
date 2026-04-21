import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildAnalyticsSnapshotFromCsvText } from "@/lib/analytics-builder";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "user_events.csv");
const outputDir = path.join(rootDir, "data");
const outputPath = path.join(outputDir, "analytics-snapshot.json");

async function main() {
  const csvText = await readFile(sourcePath, "utf8");
  const snapshot = buildAnalyticsSnapshotFromCsvText(csvText, "user_events.csv");

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  console.log(`Generated analytics snapshot at ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
