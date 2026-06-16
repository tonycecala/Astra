"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import type { ChartMakerRequest } from "@astra/contracts";
import { ui } from "../lib/i18n";
import styles from "./ChartRequestPanel.module.css";

function supportedTimeZones() {
  if (typeof Intl.supportedValuesOf !== "function") {
    throw new Error("Intl.supportedValuesOf is required for timezone selection.");
  }

  return Intl.supportedValuesOf("timeZone");
}

const timeZones = supportedTimeZones();

type ChartRequestPanelProps = {
  displayName: string;
  initialRequests: ChartMakerRequest[];
};

type FormState = {
  subjectName: string;
  date: string;
  time: string;
  timezone: string;
  location: string;
  question: string;
  intent: string;
  context: string;
};

const defaultForm = (displayName: string): FormState => ({
  subjectName: displayName,
  date: "",
  time: "",
  timezone: "",
  location: "",
  question: "",
  intent: "",
  context: ""
});

function optional(value: string) {
  const clean = value.trim();
  return clean ? clean : undefined;
}

function parseContext(value: string) {
  const clean = value.trim();
  if (!clean) return undefined;
  return { note: clean };
}

export function ChartRequestPanel({ displayName, initialRequests }: ChartRequestPanelProps) {
  const [form, setForm] = useState<FormState>(() => defaultForm(displayName));
  const [requests, setRequests] = useState(initialRequests);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitChartRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(ui.self.chartRequestWorking);

    try {
      const response = await fetch("/api/chart-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subjectName: form.subjectName.trim(),
          birthData: {
            date: form.date,
            time: optional(form.time),
            timezone: optional(form.timezone),
            location: optional(form.location)
          },
          question: optional(form.question),
          intent: optional(form.intent),
          context: parseContext(form.context),
          source: "self"
        })
      });

      const payload = (await response.json()) as { request?: ChartMakerRequest; error?: string };
      if (!response.ok || !payload.request) {
        setMessage(payload.error || ui.self.chartRequestError);
        return;
      }

      setRequests((current) => [payload.request as ChartMakerRequest, ...current]);
      setForm(defaultForm(displayName));
      setMessage(ui.self.chartRequestQueued);
    } catch {
      setMessage(ui.self.chartRequestError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.panel} aria-label={ui.self.chartRequestPanelLabel}>
      <article className="card">
        <div className="eyebrow">{ui.self.chartRequestEyebrow}</div>
        <h2>{ui.self.chartRequestTitle}</h2>
        <p>{ui.self.chartRequestIntro}</p>

        <form className={`auth-form ${styles.form}`} onSubmit={submitChartRequest}>
          <label>
            <span>{ui.self.chartSubjectLabel}</span>
            <input value={form.subjectName} onChange={(event) => updateField("subjectName", event.target.value)} required />
          </label>
          <div className={styles.formGrid}>
            <label>
              <span>{ui.self.chartDateLabel}</span>
              <input
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                required
                inputMode="numeric"
                placeholder={ui.self.chartDatePlaceholder}
              />
            </label>
            <label>
              <span>{ui.self.chartTimeLabel}</span>
              <input
                value={form.time}
                onChange={(event) => updateField("time", event.target.value)}
                inputMode="numeric"
                placeholder={ui.self.chartTimePlaceholder}
              />
            </label>
          </div>
          <div className={styles.formGrid}>
            <label>
              <span>{ui.self.chartTimezoneLabel}</span>
              <select value={form.timezone} onChange={(event) => updateField("timezone", event.target.value)}>
                <option value="">{ui.self.chartTimezonePlaceholder}</option>
                {timeZones.map((timeZone) => (
                  <option key={timeZone} value={timeZone}>
                    {timeZone.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{ui.self.chartLocationLabel}</span>
              <input value={form.location} onChange={(event) => updateField("location", event.target.value)} />
            </label>
          </div>
          <p className="form-status">{ui.self.chartPrecisionHint}</p>
          <label>
            <span>{ui.self.chartQuestionLabel}</span>
            <textarea value={form.question} onChange={(event) => updateField("question", event.target.value)} />
          </label>
          <label>
            <span>{ui.self.chartIntentLabel}</span>
            <input value={form.intent} onChange={(event) => updateField("intent", event.target.value)} />
          </label>
          <label>
            <span>{ui.self.chartContextLabel}</span>
            <textarea value={form.context} onChange={(event) => updateField("context", event.target.value)} />
          </label>
          <button className="button" type="submit" disabled={isSubmitting}>
            <Send aria-hidden="true" size={18} />
            {isSubmitting ? ui.self.chartRequestWorking : ui.self.chartRequestSubmit}
          </button>
          {message ? <p className="form-status">{message}</p> : null}
        </form>
      </article>

      <article className="card">
        <div className="eyebrow">{ui.self.chartRequestsEyebrow}</div>
        <h2>{ui.self.chartRequestsTitle}</h2>
        {requests.length ? (
          <ul className={styles.requestList}>
            {requests.slice(0, 5).map((request) => (
              <li key={request.id}>
                <span>{request.subjectName}</span>
                <strong>{request.status}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>{ui.self.chartRequestsEmpty}</p>
        )}
      </article>
    </section>
  );
}
