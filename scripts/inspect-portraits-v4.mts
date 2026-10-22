import { inspectPortraitsV4Cohort } from "./portraits-v4-inspection";

const cohortDir = process.argv[2];
if (!cohortDir) {
  console.error("Usage: node --import tsx scripts/inspect-portraits-v4.mts <cohort-dir>");
  process.exitCode = 2;
} else {
  try {
    const report = inspectPortraitsV4Cohort(cohortDir);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = report.status === "PASS" ? 0 : report.status === "INCOMPLETE" ? 2 : 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: "FAIL", findings: [{ code: "INSPECTOR_ERROR", severity: "error", message: error instanceof Error ? error.message : "Unable to inspect cohort." }] }, null, 2)}\n`);
    process.exitCode = 1;
  }
}
