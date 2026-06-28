"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Globe2, X } from "lucide-react";
import { displayTimezone } from "../lib/display";
import { ui } from "../lib/i18n";
import {
  type BirthDateTimeValue,
  buildCalendarMonth,
  defaultBrowserTimezone,
  formatDisplayTime,
  formatReadableDateOnly,
  isFutureDateOnly,
  isValidDateOnly,
  isValidTimeOnly,
  monthLabel,
  parseDateOnly
} from "./BirthDateTimeSheet.helpers";
import styles from "./BirthDateTimeSheet.module.css";

type BirthDateTimeSheetProps = {
  open: boolean;
  title?: string;
  ctaLabel: string;
  value: BirthDateTimeValue;
  timezoneOptions: string[];
  disabled?: boolean;
  onClose: () => void;
  onSave: (value: BirthDateTimeValue) => void;
};

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
const monthOptions = Array.from({ length: 12 }, (_, monthIndex) => ({
  value: monthIndex,
  label: new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2000, monthIndex, 1))
}));

function selectedMonth(value: BirthDateTimeValue) {
  const parsed = parseDateOnly(value.date) ?? new Date();
  return {
    year: parsed.getFullYear(),
    monthIndex: parsed.getMonth()
  };
}

function validate(value: BirthDateTimeValue) {
  if (!value.date || !isValidDateOnly(value.date)) return ui.self.birthMomentDateRequired;
  if (isFutureDateOnly(value.date)) return ui.self.birthMomentFutureDate;
  if (value.birthTimeKnown && !value.time) return ui.self.birthMomentTimeRequired;
  if (value.birthTimeKnown && value.time && !isValidTimeOnly(value.time)) return ui.self.birthMomentTimeInvalid;
  if (!value.timezone) return ui.self.birthMomentTimezoneRequired;
  return "";
}

export function BirthDateTimeSheet({
  open,
  title = ui.self.birthMomentSheetTitle,
  ctaLabel,
  value,
  timezoneOptions,
  disabled = false,
  onClose,
  onSave
}: BirthDateTimeSheetProps) {
  const [draft, setDraft] = useState(() => ({ ...value, timezone: value.timezone || defaultBrowserTimezone() }));
  const [visibleMonth, setVisibleMonth] = useState(() => selectedMonth({ ...value, timezone: value.timezone || defaultBrowserTimezone() }));
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const calendarDays = useMemo(
    () =>
      buildCalendarMonth({
        year: visibleMonth.year,
        monthIndex: visibleMonth.monthIndex,
        selectedDate: draft.date
      }),
    [draft.date, visibleMonth]
  );

  const canGoNext = useMemo(() => {
    const today = new Date();
    const nextMonth = new Date(visibleMonth.year, visibleMonth.monthIndex + 1, 1);
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return nextMonth.getTime() <= currentMonth.getTime();
  }, [visibleMonth]);

  if (!open || typeof document === "undefined") return null;

  function updateDraft(next: Partial<BirthDateTimeValue>) {
    setDraft((current) => ({ ...current, ...next }));
    setMessage("");
  }

  function selectDay(date: string, isFuture: boolean) {
    if (isFuture || disabled) return;
    updateDraft({ date });
  }

  function moveMonth(delta: number) {
    setVisibleMonth((current) => {
      const next = new Date(current.year, current.monthIndex + delta, 1);
      return { year: next.getFullYear(), monthIndex: next.getMonth() };
    });
  }

  function setVisibleYear(year: number) {
    if (!Number.isInteger(year) || year < 1) return;
    const today = new Date();
    const cappedYear = Math.min(year, today.getFullYear());
    setVisibleMonth((current) => ({ ...current, year: cappedYear }));
  }

  function save() {
    const error = validate(draft);
    if (error) {
      setMessage(error);
      return;
    }

    onSave({
      ...draft,
      time: draft.birthTimeKnown ? draft.time : null,
      timezone: draft.timezone || defaultBrowserTimezone()
    });
  }

  const consequence = draft.birthTimeKnown
    ? draft.date && draft.time && draft.timezone
      ? ui.self.birthMomentKnownConsequence(formatReadableDateOnly(draft.date), formatDisplayTime(draft.time), displayTimezone(draft.timezone))
      : ui.self.birthMomentKnownHint
    : ui.self.birthMomentUnknownConsequence;

  return createPortal(
    <div className={styles.backdrop} role="presentation">
      <section aria-labelledby="birth-moment-sheet-title" aria-modal="true" className={styles.sheet} role="dialog">
        <header className={styles.header}>
          <button aria-label={ui.self.birthMomentClose} className={styles.iconButton} onClick={onClose} type="button">
            <X aria-hidden="true" size={16} />
          </button>
          <h2 id="birth-moment-sheet-title">{title}</h2>
          <button className={styles.primaryAction} disabled={disabled} onClick={save} type="button">
            {ctaLabel}
          </button>
        </header>

        <div className={styles.calendarCard}>
          <div className={styles.monthHeader}>
            <button aria-label={ui.self.birthMomentPreviousMonth} className={styles.iconButton} onClick={() => moveMonth(-1)} type="button">
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
            <strong>{monthLabel(visibleMonth.year, visibleMonth.monthIndex)}</strong>
            <button
              aria-label={ui.self.birthMomentNextMonth}
              className={styles.iconButton}
              disabled={!canGoNext}
              onClick={() => moveMonth(1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </div>
          <div className={styles.monthJump}>
            <label>
              <span>{ui.self.birthMomentMonth}</span>
              <select
                aria-label={ui.self.birthMomentMonth}
                onChange={(event) => setVisibleMonth((current) => ({ ...current, monthIndex: Number.parseInt(event.target.value, 10) }))}
                value={visibleMonth.monthIndex}
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{ui.self.birthMomentYear}</span>
              <input
                aria-label={ui.self.birthMomentYear}
                inputMode="numeric"
                max={new Date().getFullYear()}
                min={1}
                onChange={(event) => setVisibleYear(Number.parseInt(event.target.value, 10))}
                type="number"
                value={visibleMonth.year}
              />
            </label>
          </div>
          <div className={styles.weekdays} aria-hidden="true">
            {dayLabels.map((dayLabel, index) => (
              <span key={`${dayLabel}-${index}`}>{dayLabel}</span>
            ))}
          </div>
          <div className={styles.dayGrid} role="grid" aria-label={ui.self.birthMomentCalendarLabel}>
            {calendarDays.map((day) => (
              <button
                aria-disabled={day.isFuture}
                aria-label={ui.self.birthMomentDayLabel(formatReadableDateOnly(day.date), day.isSelected)}
                aria-pressed={day.isSelected}
                className={styles.dayButton}
                data-in-month={day.inMonth}
                data-selected={day.isSelected}
                disabled={day.isFuture || disabled}
                key={day.date}
                onClick={() => selectDay(day.date, day.isFuture)}
                type="button"
              >
                {day.day}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlsCard}>
          <label className={styles.controlRow}>
            <span>
              <Clock3 aria-hidden="true" size={17} />
              {ui.self.birthMomentTime}
            </span>
            <input
              aria-label={ui.self.birthMomentTime}
              className={styles.timeInput}
              disabled={disabled || !draft.birthTimeKnown}
              onChange={(event) => updateDraft({ time: event.target.value })}
              type="time"
              value={draft.time ?? ""}
            />
          </label>
          <label className={styles.controlRow}>
            <span>
              <Globe2 aria-hidden="true" size={17} />
              {ui.self.birthMomentTimezone}
            </span>
            <select
              aria-label={ui.self.birthMomentTimezone}
              disabled={disabled}
              onChange={(event) => updateDraft({ timezone: event.target.value })}
              value={draft.timezone}
            >
              <option value="">{ui.self.chartTimezonePlaceholder}</option>
              {timezoneOptions.map((timeZone) => (
                <option key={timeZone} value={timeZone}>
                  {displayTimezone(timeZone)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.unknownRow}>
            <input
              checked={!draft.birthTimeKnown}
              disabled={disabled}
              onChange={(event) => updateDraft({ birthTimeKnown: !event.target.checked, time: event.target.checked ? null : draft.time })}
              type="checkbox"
            />
            <span>
              <CalendarDays aria-hidden="true" size={17} />
              <span>
                <strong>{ui.self.birthMomentUnknownTime}</strong>
                {ui.self.birthMomentUnknownTimeBody ? <em>{ui.self.birthMomentUnknownTimeBody}</em> : null}
              </span>
            </span>
          </label>
        </div>

        {consequence ? <p className={styles.helperText}>{consequence}</p> : null}
        {message ? <p className={styles.errorText} aria-live="polite">{message}</p> : null}
      </section>
    </div>,
    document.body
  );
}
