import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildChartMakerRecordResult } from "@astra/chart-maker";
import { hasResolvedBirthCoordinates, type ChartBirthData } from "@astra/contracts";
import {
  closeDatabaseConnection,
  db,
  exportPortableUserData,
  recordChartMakerResult,
  updateUserChartMakerBirthData
} from "@astra/db";

type RepairPlace = {
  matches: string[];
  timezone: string;
  location: string;
  latitude: number;
  longitude: number;
};

type RepairManifest = {
  schemaVersion: 1;
  provenance: { resolvedAt: string; source: string };
  places: RepairPlace[];
};

const email = option("--email")?.trim().toLowerCase() || "astramaster@tony.io";
const apply = process.argv.includes("--apply");
const manifestPath = resolve(option("--manifest") || "scripts/data/birth-place-coordinate-repairs.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as RepairManifest;

if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.places)) {
  throw new Error("Birth-place repair manifest is not schema version 1.");
}

try {
  const before = await exportPortableUserData(db, { email, sourceLabel: "birth-place-repair-before" });
  const userId = before.account.sourceUserId;
  const historicalReportHash = hashReports(before.data.reportRequests, before.data.reportResults);
  const unresolved = before.data.chartRequests.filter(
    (request) => request.birthData.location && !hasResolvedBirthCoordinates(request.birthData)
  );
  const repairs = unresolved.map((request) => {
    const place = findRepair(request.birthData);
    if (!place) {
      throw new Error(
        `No approved coordinate repair for ${request.id}: ${request.birthData.location} (${request.birthData.timezone ?? "no timezone"}).`
      );
    }
    return { request, place };
  });

  console.log(`${apply ? "Applying" : "Dry run:"} ${repairs.length} chart-place repairs for ${email}.`);
  for (const { request, place } of repairs) {
    console.log(`- ${request.subjectName}: ${request.birthData.location} -> ${place.location}`);
    if (!apply) continue;
    const updated = await updateUserChartMakerBirthData(db, {
      requestId: request.id,
      userId,
      birthData: {
        ...request.birthData,
        location: place.location,
        latitude: place.latitude,
        longitude: place.longitude
      }
    });
    await recordChartMakerResult(db, buildChartMakerRecordResult(updated));
  }

  if (!apply) {
    console.log("No data changed. Re-run with --apply after reviewing this list.");
  } else {
    const after = await exportPortableUserData(db, { email, sourceLabel: "birth-place-repair-after" });
    const afterHistoricalReportHash = hashReports(after.data.reportRequests, after.data.reportResults);
    if (afterHistoricalReportHash !== historicalReportHash) {
      throw new Error("Historical report requests or results changed during birth-place repair.");
    }
    const stillUnresolved = after.data.chartRequests.filter(
      (request) => request.birthData.location && !hasResolvedBirthCoordinates(request.birthData)
    );
    if (stillUnresolved.length) {
      throw new Error(`Repair left ${stillUnresolved.length} labeled chart locations unresolved.`);
    }
    const noPlace = after.data.chartRequests.filter((request) => !request.birthData.location).length;
    console.log(`Verified ${repairs.length} repaired charts, ${noPlace} intentional no-place charts, and unchanged historical reports.`);
    console.log(`Historical report hash: ${historicalReportHash}`);
  }
} finally {
  await closeDatabaseConnection();
}

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function normalized(value: string | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function findRepair(birthData: ChartBirthData) {
  return manifest.places.find(
    (place) =>
      normalized(place.timezone) === normalized(birthData.timezone) &&
      place.matches.some((match) => normalized(match) === normalized(birthData.location))
  );
}

function hashReports(reportRequests: unknown[], reportResults: unknown[]) {
  const stable = [reportRequests, reportResults].map((records) =>
    [...records].sort((left, right) => recordId(left).localeCompare(recordId(right)))
  );
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}

function recordId(record: unknown) {
  if (!record || typeof record !== "object" || !("id" in record) || typeof record.id !== "string") {
    throw new Error("Portable report record is missing an id.");
  }
  return record.id;
}
