import {
  formatDisplayTime,
  isFutureDateOnly,
  isValidDateOnly,
  isValidTimeOnly
} from "../apps/astra-web/components/BirthDateTimeSheet.helpers";
import {
  chartBirthDataSchema,
  chartCalculationModeForBirthData,
  createChartBirthDataSchema
} from "@astra/contracts";

const today = new Date(2026, 5, 28);
if (!isFutureDateOnly("2026-06-29", today)) {
  throw new Error("Future birth dates must be detected.");
}

if (isValidDateOnly("2026-02-31")) {
  throw new Error("Impossible dates must be rejected.");
}

if (!isValidTimeOnly("09:30") || isValidTimeOnly("25:99")) {
  throw new Error("Time validation should accept HH:mm and reject impossible times.");
}

if (formatDisplayTime("09:30", "en-US") !== "9:30 AM") {
  throw new Error("Time display should preserve 12-hour formatting for 12-hour locales.");
}

if (!/^0?9:30$/.test(formatDisplayTime("09:30", "en-GB"))) {
  throw new Error("Time display should preserve 24-hour formatting for 24-hour locales.");
}

chartBirthDataSchema.parse({
  date: "1961-05-23",
  timezone: "America/New_York",
  birthTimeKnown: false
});

const unknownWithFakeTime = chartBirthDataSchema.safeParse({
  date: "1961-05-23",
  time: "12:00",
  timezone: "America/New_York",
  birthTimeKnown: false
});
if (unknownWithFakeTime.success) {
  throw new Error("Unknown birth time must not store a fake exact time.");
}

const future = chartBirthDataSchema.safeParse({
  date: "2999-01-01",
  timezone: "America/New_York",
  birthTimeKnown: false
});
if (future.success) {
  throw new Error("Future birth dates must be rejected by the contract.");
}

if (!chartBirthDataSchema.safeParse({ date: "1961-05-23", location: "Imported placeholder", latitude: 0, longitude: 0 }).success) {
  throw new Error("The legacy birth-data reader must remain compatible with historical placeholder coordinates.");
}

if (createChartBirthDataSchema.safeParse({ date: "1961-05-23", location: "Imported placeholder", latitude: 0, longitude: 0 }).success) {
  throw new Error("New charts must reject placeholder 0,0 coordinates.");
}

if (createChartBirthDataSchema.safeParse({ date: "1961-05-23", location: "Incomplete", latitude: 40.7 }).success) {
  throw new Error("New charts must reject incomplete coordinate pairs.");
}

const noPlace = createChartBirthDataSchema.parse({
  date: "1961-05-23",
  time: "09:30",
  timezone: "America/Chicago",
  birthTimeKnown: true
});
if (chartCalculationModeForBirthData(noPlace) !== "signs-aspects-only") {
  throw new Error("A known time without a resolved place must use signs-and-aspects-only calculation.");
}

const resolvedPlace = createChartBirthDataSchema.parse({
  ...noPlace,
  location: "Dallas, TX, USA",
  latitude: 32.7762719,
  longitude: -96.7968559
});
if (chartCalculationModeForBirthData(resolvedPlace) !== "full") {
  throw new Error("A known time with a resolved place must use full chart calculation.");
}

console.log("Birth date/time sheet smoke passed.");
