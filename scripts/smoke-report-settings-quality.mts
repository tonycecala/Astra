import assert from "node:assert/strict";
import {
  ASTRA_EPHEMERIS_ENGINE_ENV,
  ASTRA_REPORT_WRITER_ENV,
  LOCAL_CHART_ROUTINE_ENGINE,
  LOCAL_DETERMINISTIC_REPORT_WRITER,
  buildAstrologyChartSnapshot,
  buildAstrologyReportResult
} from "@astra/astrology";
import { astrologyReportRequestSchema, type ChartBirthData, type ChartSettings } from "@astra/contracts";

const people: Array<{ id: string; name: string; subjectType: "self" | "ally"; birthData: ChartBirthData }> = [
  {
    id: "self-tony",
    name: "Tony C",
    subjectType: "self",
    birthData: {
      date: "1961-05-23",
      time: "09:30",
      timezone: "America/Chicago",
      location: "Chicago, IL",
      latitude: 41.8781,
      longitude: -87.6298
    }
  },
  {
    id: "ally-ezra",
    name: "Ezra",
    subjectType: "ally",
    birthData: {
      date: "2021-12-23",
      time: "01:50",
      timezone: "America/Chicago",
      location: "Plano, TX",
      latitude: 33.0198,
      longitude: -96.6989
    }
  }
];

const settingsMatrix: ChartSettings[] = [
  { zodiacMode: "tropical", houseSystem: "whole-sign" },
  { zodiacMode: "tropical", houseSystem: "placidus" },
  { zodiacMode: "sidereal", houseSystem: "whole-sign" },
  { zodiacMode: "sidereal", houseSystem: "placidus" }
];

function label(value: string) {
  if (value === "whole-sign") return "Whole Sign";
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function placement(snapshot: ReturnType<typeof buildAstrologyChartSnapshot>, bodyId: string) {
  const found = snapshot.placements.find((item) => item.bodyId === bodyId);
  assert.ok(found, `Expected ${bodyId} placement.`);
  return found;
}

function cuspWidths(snapshot: ReturnType<typeof buildAstrologyChartSnapshot>) {
  const ordered = [...snapshot.houseCusps].sort((left, right) => left.house - right.house);
  return ordered.map((cusp, index) => {
    const next = ordered[(index + 1) % ordered.length];
    assert.ok(next, "Expected a complete house cusp sequence.");
    return Number((((next.angle - cusp.angle) + 360) % 360).toFixed(3));
  });
}

process.env[ASTRA_EPHEMERIS_ENGINE_ENV] = LOCAL_CHART_ROUTINE_ENGINE;
process.env[ASTRA_REPORT_WRITER_ENV] = LOCAL_DETERMINISTIC_REPORT_WRITER;

for (const person of people) {
  const variants = settingsMatrix.map((chartSettings) => {
    const request = astrologyReportRequestSchema.parse({
      id: `settings-quality-${person.id}-${chartSettings.zodiacMode}-${chartSettings.houseSystem}`,
      userId: "settings-quality-user",
      reportType: "identity",
      subjectName: person.name,
      birthData: person.birthData,
      source: person.subjectType,
      boundary: "private",
      status: "queued",
      costCredits: 1,
      createdAt: "2026-07-16T12:00:00.000Z",
      updatedAt: "2026-07-16T12:00:00.000Z",
      reportBasis: {
        schemaVersion: 1,
        type: "natal",
        chartSettings,
        primary: {
          chartRequestId: `chart-${person.id}`,
          subjectType: person.subjectType,
          subjectId: person.id,
          subjectName: person.name,
          birthData: person.birthData
        }
      }
    });
    const snapshot = buildAstrologyChartSnapshot(request);
    const result = buildAstrologyReportResult(request);
    assert.equal(result.status, "completed");
    const customerText = `${result.summary ?? ""} ${result.sections.map((section) => section.body).join(" ")}`;
    const sun = placement(snapshot, "sun");
    const moon = placement(snapshot, "moon");

    assert.match(customerText, new RegExp(label(chartSettings.zodiacMode), "i"));
    assert.match(customerText, new RegExp(label(chartSettings.houseSystem), "i"));
    assert.match(customerText, new RegExp(`${sun.sign} Sun`, "i"));
    assert.match(customerText, new RegExp(`${moon.sign} Moon`, "i"));
    assert.match(customerText, new RegExp(`Sun in the ${sun.house}`));
    assert.match(customerText, new RegExp(`Moon in the ${moon.house}`));
    assert.doesNotMatch(customerText, /local-deterministic-writer|external model call|intent marker/i);
    assert.match(result.publicSignal?.provenanceSummary ?? "", new RegExp(`${chartSettings.zodiacMode}, ${chartSettings.houseSystem}`));

    return { chartSettings, snapshot, customerText };
  });

  const tropical = variants.find((variant) => variant.chartSettings.zodiacMode === "tropical" && variant.chartSettings.houseSystem === "whole-sign");
  const sidereal = variants.find((variant) => variant.chartSettings.zodiacMode === "sidereal" && variant.chartSettings.houseSystem === "whole-sign");
  const wholeSign = tropical;
  const placidus = variants.find((variant) => variant.chartSettings.zodiacMode === "tropical" && variant.chartSettings.houseSystem === "placidus");
  assert.ok(tropical && sidereal && wholeSign && placidus);

  assert.notEqual(placement(tropical.snapshot, "sun").sign, placement(sidereal.snapshot, "sun").sign, `${person.name}: zodiac mode must change the Sun sign evidence.`);
  assert.notEqual(placement(wholeSign.snapshot, "sun").house, placement(placidus.snapshot, "sun").house, `${person.name}: house system must change the Sun house evidence.`);
  assert.deepEqual(cuspWidths(wholeSign.snapshot), Array.from({ length: 12 }, () => 30), `${person.name}: Whole Sign cusps must remain equal.`);
  assert.ok(new Set(cuspWidths(placidus.snapshot)).size > 1, `${person.name}: Placidus cusps must preserve unequal calculated widths.`);
  assert.equal(new Set(variants.map((variant) => variant.customerText)).size, settingsMatrix.length, `${person.name}: every settings combination must produce distinct customer prose.`);
}

console.log("Report settings quality smoke checks passed for the same Self and Ally birth data.");
