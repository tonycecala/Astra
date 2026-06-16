const { closeDatabaseConnection, createChartMakerRequest, db, listUserChartMakerRequests, recordChartMakerResult } =
  await import("@astra/db");

try {
  const [profile] = await db.query.appUserProfiles.findMany({
    limit: 1
  });

  if (!profile) {
    throw new Error("No app profile found. Run npm run db:migrate && npm run db:seed -- --execute first.");
  }

  const request = await createChartMakerRequest(db, {
    userId: profile.userId,
    subjectName: "Tony C",
    birthData: {
      date: "1961-05-23",
      time: "09:30",
      timezone: "America/New_York",
      location: "New York, NY, USA",
      latitude: 40.7128,
      longitude: -74.006
    },
    question: "What pattern should Astra hold for this user?",
    intent: "tony-chart-boundary-smoke",
    context: {
      source: "test:chart-boundary"
    },
    source: "self"
  });

  const result = await recordChartMakerResult(db, {
    requestId: request.id,
    userId: profile.userId,
    engine: "astra-local-contract-smoke",
    status: "completed",
    summary: "Chart boundary smoke completed.",
    chartData: {
      sun: "capricorn",
      moon: "unknown",
      ascendant: "unknown"
    }
  });

  const requests = await listUserChartMakerRequests(db, profile.userId);
  if (!requests.some((candidate) => candidate.id === request.id && candidate.status === "completed")) {
    throw new Error("Completed chart request was not returned by the user-owned request list.");
  }

  console.log(`Chart boundary smoke passed: ${request.id} -> ${result.id}.`);
} finally {
  await closeDatabaseConnection();
}
