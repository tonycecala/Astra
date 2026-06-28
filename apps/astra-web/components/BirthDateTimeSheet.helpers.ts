export type BirthDateTimeValue = {
  date: string;
  time: string | null;
  timezone: string;
  birthTimeKnown: boolean;
};

export type CalendarDay = {
  date: string;
  day: number;
  inMonth: boolean;
  isFuture: boolean;
  isSelected: boolean;
};

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function toDateOnly(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number.parseInt(yearText ?? "", 10);
  const month = Number.parseInt(monthText ?? "", 10);
  const day = Number.parseInt(dayText ?? "", 10);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
  return parsed;
}

export function isValidDateOnly(value: string) {
  return Boolean(parseDateOnly(value));
}

export function isFutureDateOnly(value: string, today = new Date()) {
  const parsed = parseDateOnly(value);
  if (!parsed) return false;
  const todayOnly = parseDateOnly(toDateOnly(today));
  return todayOnly ? parsed.getTime() > todayOnly.getTime() : false;
}

export function isValidTimeOnly(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hourText, minuteText] = value.split(":");
  const hour = Number.parseInt(hourText ?? "", 10);
  const minute = Number.parseInt(minuteText ?? "", 10);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function monthLabel(year: number, monthIndex: number) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(year, monthIndex, 1));
}

export function formatReadableDateOnly(value?: string | null) {
  const parsed = value ? parseDateOnly(value) : null;
  if (!parsed) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

export function formatDisplayTime(value?: string | null, locales?: Intl.LocalesArgument) {
  if (!value || !isValidTimeOnly(value)) return "";
  const [hourText, minuteText] = value.split(":");
  const hour = Number.parseInt(hourText ?? "0", 10);
  const minute = Number.parseInt(minuteText ?? "0", 10);
  return new Intl.DateTimeFormat(locales, { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hour, minute));
}

export function buildCalendarMonth(input: {
  year: number;
  monthIndex: number;
  selectedDate?: string;
  today?: Date;
}): CalendarDay[] {
  const first = new Date(input.year, input.monthIndex, 1);
  const start = new Date(input.year, input.monthIndex, 1 - first.getDay());
  const today = input.today ?? new Date();
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    const dateOnly = toDateOnly(date);
    return {
      date: dateOnly,
      day: date.getDate(),
      inMonth: date.getMonth() === input.monthIndex,
      isFuture: isFutureDateOnly(dateOnly, today),
      isSelected: input.selectedDate === dateOnly
    };
  });
}

export function defaultBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";
  } catch {
    return "America/Chicago";
  }
}
