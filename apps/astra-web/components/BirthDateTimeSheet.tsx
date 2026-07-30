"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CalendarDays, Clock3, Globe2, X } from "lucide-react";
import { displayTimezone } from "../lib/display";
import { ui } from "../lib/i18n";
import {
  type BirthDateTimeValue,
  defaultBrowserTimezone,
  formatDisplayTime,
  formatReadableDateOnly,
  isFutureDateOnly,
  isValidDateOnly,
  isValidTimeOnly,
  pad2,
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

const monthOptions = Array.from({ length: 12 }, (_, monthIndex) => ({
  value: monthIndex + 1,
  label: new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2000, monthIndex, 1))
}));
const dayOptions = Array.from({ length: 31 }, (_, index) => index + 1);

type DateParts = {
  month: string;
  day: string;
  year: string;
};

function datePartsFromValue(date: string): DateParts {
  const parsed = parseDateOnly(date);
  if (!parsed) return { month: "", day: "", year: "" };
  return {
    month: String(parsed.getMonth() + 1),
    day: String(parsed.getDate()),
    year: String(parsed.getFullYear())
  };
}

function dateFromParts(parts: DateParts) {
  if (!parts.month || !parts.day || parts.year.length !== 4) return "";
  return `${parts.year}-${pad2(Number.parseInt(parts.month, 10))}-${pad2(Number.parseInt(parts.day, 10))}`;
}

function dateValidationError(parts: DateParts) {
  if (!parts.month || !parts.day || parts.year.length !== 4) return ui.self.birthMomentDateIncomplete;
  const date = dateFromParts(parts);
  if (!isValidDateOnly(date)) return ui.self.birthMomentDateRequired;
  if (isFutureDateOnly(date)) return ui.self.birthMomentFutureDate;
  return "";
}

function timeValidationError(value: BirthDateTimeValue) {
  if (value.birthTimeKnown && !value.time) return ui.self.birthMomentTimeRequired;
  if (value.birthTimeKnown && value.time && !isValidTimeOnly(value.time)) return ui.self.birthMomentTimeInvalid;
  return "";
}

function timezoneValidationError(value: BirthDateTimeValue) {
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
  const [dateParts, setDateParts] = useState(() => datePartsFromValue(value.date));
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  function updateDraft(next: Partial<BirthDateTimeValue>) {
    setDraft((current) => ({ ...current, ...next }));
    setMessage("");
  }

  function updateDatePart(part: keyof DateParts, value: string) {
    const next = {
      ...dateParts,
      [part]: part === "year" ? value.replace(/\D/g, "").slice(0, 4) : value
    };
    setDateParts(next);
    updateDraft({ date: dateFromParts(next) });
  }

  function save() {
    const error = dateValidationError(dateParts) || timeValidationError(draft) || timezoneValidationError(draft);
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

  const dateError = dateValidationError(dateParts);
  const timeError = timeValidationError(draft);
  const timezoneError = timezoneValidationError(draft);
  const validationError = dateError || timeError || timezoneError;
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
          <button className={styles.primaryAction} disabled={disabled || Boolean(validationError)} onClick={save} type="button">
            {ctaLabel}
          </button>
        </header>

        <section className={styles.dateCard} data-invalid={Boolean(dateError)}>
          <h3>{ui.self.birthMomentDate}</h3>
          <div className={styles.dateFields}>
            <label>
              <span>{ui.self.birthMomentMonth}</span>
              <select
                aria-label={ui.self.birthMomentMonth}
                aria-describedby={dateError ? "birth-date-error" : undefined}
                aria-invalid={Boolean(dateError)}
                autoComplete="bday-month"
                disabled={disabled}
                onChange={(event) => updateDatePart("month", event.target.value)}
                value={dateParts.month}
              >
                <option value="">{ui.self.birthMomentMonthPlaceholder}</option>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{ui.self.birthMomentDay}</span>
              <select
                aria-label={ui.self.birthMomentDay}
                aria-describedby={dateError ? "birth-date-error" : undefined}
                aria-invalid={Boolean(dateError)}
                autoComplete="bday-day"
                disabled={disabled}
                onChange={(event) => updateDatePart("day", event.target.value)}
                value={dateParts.day}
              >
                <option value="">{ui.self.birthMomentDayPlaceholder}</option>
                {dayOptions.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{ui.self.birthMomentYear}</span>
              <input
                autoComplete="bday-year"
                aria-label={ui.self.birthMomentYear}
                aria-describedby={dateError ? "birth-date-error" : undefined}
                aria-invalid={Boolean(dateError)}
                disabled={disabled}
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => updateDatePart("year", event.target.value)}
                pattern="[0-9]*"
                placeholder={ui.self.birthMomentYearPlaceholder}
                type="text"
                value={dateParts.year}
              />
            </label>
          </div>
          {dateError ? (
            <p className={styles.dateError} id="birth-date-error" role="alert">
              <AlertCircle aria-hidden="true" size={15} />
              {dateError}
            </p>
          ) : null}
        </section>

        <section className={styles.controlsCard}>
          <h3>{ui.self.birthMomentTimeSection}</h3>
          <label className={styles.controlRow} data-invalid={Boolean(timeError)}>
            <span>
              <Clock3 aria-hidden="true" size={17} />
              {ui.self.birthMomentTime}
            </span>
            <input
              aria-label={ui.self.birthMomentTime}
              aria-describedby={timeError ? "birth-time-error" : undefined}
              aria-invalid={Boolean(timeError)}
              className={styles.timeInput}
              disabled={disabled || !draft.birthTimeKnown}
              onChange={(event) => updateDraft({ time: event.target.value })}
              type="time"
              value={draft.time ?? ""}
            />
            {timeError ? <small className={styles.fieldError} id="birth-time-error">{timeError}</small> : null}
          </label>
          <label className={styles.controlRow} data-invalid={Boolean(timezoneError)}>
            <span>
              <Globe2 aria-hidden="true" size={17} />
              {ui.self.birthMomentTimezone}
            </span>
            <select
              aria-label={ui.self.birthMomentTimezone}
              aria-describedby={timezoneError ? "birth-timezone-error" : undefined}
              aria-invalid={Boolean(timezoneError)}
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
            {timezoneError ? <small className={styles.fieldError} id="birth-timezone-error">{timezoneError}</small> : null}
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
        </section>

        {consequence ? <p className={styles.helperText}>{consequence}</p> : null}
        {message ? <p className={styles.errorText} aria-live="polite">{message}</p> : null}
      </section>
    </div>,
    document.body
  );
}
