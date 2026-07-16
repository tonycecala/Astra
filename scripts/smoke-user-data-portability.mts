import { portableUserDataBundleSchema } from "@astra/contracts";

const sourceUserId = "portable-user";
const validBundle = {
  format: "astra-portable-user-data",
  schemaVersion: 1,
  exportedAt: "2026-07-16T18:00:00.000Z",
  source: { label: "test" },
  account: { sourceUserId, email: "portable@example.com", displayName: "Portable User" },
  data: {
    allies: [],
    chartRequests: [
      {
        id: "chart-1",
        userId: sourceUserId,
        subjectName: "Portable User",
        birthData: { date: "1990-01-01" },
        source: "self",
        status: "completed",
        createdAt: "2026-07-16T18:00:00.000Z",
        updatedAt: "2026-07-16T18:00:00.000Z"
      }
    ],
    chartResults: [
      {
        id: "chart-result-1",
        requestId: "chart-1",
        userId: sourceUserId,
        engine: "test",
        status: "completed",
        chartData: {},
        createdAt: "2026-07-16T18:00:00.000Z"
      }
    ],
    reportRequests: [],
    reportResults: []
  }
};

portableUserDataBundleSchema.parse(validBundle);

const orphaned = structuredClone(validBundle);
orphaned.data.chartResults[0]!.requestId = "missing-chart";
if (portableUserDataBundleSchema.safeParse(orphaned).success) {
  throw new Error("Portable bundle must reject orphaned chart results.");
}

const foreignOwned = structuredClone(validBundle);
foreignOwned.data.chartRequests[0]!.userId = "another-user";
if (portableUserDataBundleSchema.safeParse(foreignOwned).success) {
  throw new Error("Portable bundle must reject records owned by another source user.");
}

const secretBearing = { ...validBundle, sessionToken: "must-not-travel" };
if (portableUserDataBundleSchema.safeParse(secretBearing).success) {
  throw new Error("Portable bundle must reject undeclared auth or secret fields.");
}

console.log("User data portability contract smoke passed.");
