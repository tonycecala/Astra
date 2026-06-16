"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenText, Check, Search, Send, Sparkles } from "lucide-react";
import type { AstrologyReportRequest, AstrologyReportResult, BirthPlaceSearchResult, ChartMakerRequest } from "@astra/contracts";
import { ui } from "../lib/i18n";
import styles from "./BirthOnboardingPanel.module.css";

function supportedTimeZones() {
  if (typeof Intl.supportedValuesOf !== "function") {
    throw new Error("Intl.supportedValuesOf is required for timezone selection.");
  }

  return Intl.supportedValuesOf("timeZone");
}

const timeZones = supportedTimeZones();
const steps = ["subject", "birth_date", "precision", "intent", "review"] as const;

type Step = (typeof steps)[number];
type PrecisionMode = "date_only" | "timed_location";

type BirthOnboardingPanelProps = {
  displayName: string;
  initialRequests: ChartMakerRequest[];
  initialReportRequests: AstrologyReportRequest[];
  initialReportResults: AstrologyReportResult[];
};

type FormState = {
  subjectName: string;
  relationship: string;
  reason: string;
  date: string;
  precisionMode: PrecisionMode;
  time: string;
  timezone: string;
  location: string;
  latitude: string;
  longitude: string;
  question: string;
  intent: string;
  context: string;
};

const defaultForm = (displayName: string): FormState => ({
  subjectName: displayName,
  relationship: "self",
  reason: "",
  date: "",
  precisionMode: "date_only",
  time: "",
  timezone: "",
  location: "",
  latitude: "",
  longitude: "",
  question: "",
  intent: "",
  context: ""
});

function optional(value: string) {
  const clean = value.trim();
  return clean ? clean : undefined;
}

function parseContext(form: FormState) {
  const context: Record<string, string> = {};
  const relationship = optional(form.relationship);
  const reason = optional(form.reason);
  const note = optional(form.context);
  if (relationship) context.relationship = relationship;
  if (reason) context.reason = reason;
  if (note) context.note = note;
  return Object.keys(context).length ? context : undefined;
}

function birthDataFor(form: FormState) {
  const birthData = {
    date: form.date,
    time: form.precisionMode === "timed_location" ? optional(form.time) : undefined,
    timezone: form.precisionMode === "timed_location" ? optional(form.timezone) : undefined,
    location: form.precisionMode === "timed_location" ? optional(form.location) : undefined,
    latitude: form.precisionMode === "timed_location" && optional(form.latitude) ? Number(form.latitude) : undefined,
    longitude: form.precisionMode === "timed_location" && optional(form.longitude) ? Number(form.longitude) : undefined
  };

  return Object.fromEntries(Object.entries(birthData).filter(([, value]) => value !== undefined));
}

function stepIndex(step: Step) {
  return steps.indexOf(step);
}

export function BirthOnboardingPanel({
  displayName,
  initialRequests,
  initialReportRequests,
  initialReportResults = []
}: BirthOnboardingPanelProps) {
  const [form, setForm] = useState<FormState>(() => defaultForm(displayName));
  const [activeStep, setActiveStep] = useState<Step>("subject");
  const [requests, setRequests] = useState(initialRequests);
  const [reportRequests, setReportRequests] = useState(initialReportRequests);
  const [reportResults, setReportResults] = useState(initialReportResults);
  const [selectedReportRequestId, setSelectedReportRequestId] = useState(initialReportResults[0]?.requestId ?? "");
  const [message, setMessage] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<BirthPlaceSearchResult[]>([]);
  const [placeMessage, setPlaceMessage] = useState("");
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingReportId, setGeneratingReportId] = useState("");
  const [publishingReportId, setPublishingReportId] = useState("");

  const activeStepIndex = stepIndex(activeStep);
  const canSubmit = activeStep === "review";
  const reviewRows = useMemo(
    () => [
      [ui.self.onboardingReviewSubject, form.subjectName || ui.self.onboardingReviewMissing],
      [ui.self.onboardingReviewBirthDate, form.date || ui.self.onboardingReviewMissing],
      [
        ui.self.onboardingReviewPrecision,
        form.precisionMode === "timed_location"
          ? `${form.time || ui.self.onboardingReviewMissing}, ${form.timezone || ui.self.onboardingReviewMissing}, ${form.location || ui.self.onboardingReviewMissing}`
          : ui.self.onboardingDateOnlyPrecision
      ],
      [ui.self.onboardingReviewQuestion, form.question || ui.self.onboardingReviewNone],
      [ui.self.onboardingReviewIntent, form.intent || ui.self.onboardingReviewNone],
      [ui.self.onboardingReviewContext, form.context || form.reason || ui.self.onboardingReviewNone]
    ],
    [form]
  );
  const reportResultsByRequestId = useMemo(
    () => new Map(reportResults.map((result) => [result.requestId, result])),
    [reportResults]
  );
  const selectedReportResult = selectedReportRequestId ? reportResultsByRequestId.get(selectedReportRequestId) : undefined;

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function selectPlace(place: BirthPlaceSearchResult) {
    setForm((current) => ({
      ...current,
      location: place.label,
      timezone: place.timezone,
      latitude: String(place.latitude),
      longitude: String(place.longitude)
    }));
    setPlaceMessage(ui.self.placeSearchSelected(place.label));
  }

  async function searchPlaces() {
    const query = placeQuery.trim();
    if (query.length < 2) {
      setPlaceMessage(ui.self.placeSearchQueryRequired);
      return;
    }

    setIsSearchingPlaces(true);
    setPlaceMessage(ui.self.placeSearchWorking);

    try {
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}&limit=5`);
      const payload = (await response.json()) as { results?: BirthPlaceSearchResult[]; error?: string; message?: string };
      if (!response.ok) {
        setPlaceResults([]);
        setPlaceMessage(payload.message || payload.error || ui.self.placeSearchError);
        return;
      }

      const results = payload.results ?? [];
      setPlaceResults(results);
      setPlaceMessage(results.length ? ui.self.placeSearchResultCount(results.length) : ui.self.placeSearchEmpty);
    } catch {
      setPlaceResults([]);
      setPlaceMessage(ui.self.placeSearchError);
    } finally {
      setIsSearchingPlaces(false);
    }
  }

  function stepError(step: Step) {
    if (step === "subject" && !optional(form.subjectName)) return ui.self.onboardingSubjectRequired;
    if (step === "birth_date" && !/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return ui.self.onboardingDateRequired;
    if (step === "precision" && form.precisionMode === "timed_location") {
      if (!optional(form.time) || !optional(form.timezone) || !optional(form.location)) {
        return ui.self.onboardingPrecisionRequired;
      }
      if (!/^\d{2}:\d{2}$/.test(form.time)) return ui.self.onboardingTimeRequired;
      if ((optional(form.latitude) && Number.isNaN(Number(form.latitude))) || (optional(form.longitude) && Number.isNaN(Number(form.longitude)))) {
        return ui.self.onboardingCoordinatesRequired;
      }
    }
    return "";
  }

  function goToStep(nextStep: Step) {
    const currentError = stepError(activeStep);
    if (stepIndex(nextStep) > activeStepIndex && currentError) {
      setMessage(currentError);
      return;
    }
    setActiveStep(nextStep);
    setMessage("");
  }

  function goNext() {
    const currentError = stepError(activeStep);
    if (currentError) {
      setMessage(currentError);
      return;
    }

    const next = steps[activeStepIndex + 1];
    if (next) {
      setActiveStep(next);
      setMessage("");
    }
  }

  function goBack() {
    const previous = steps[activeStepIndex - 1];
    if (previous) {
      setActiveStep(previous);
      setMessage("");
    }
  }

  async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...init.headers
      }
    });
    const text = await response.text();
    let payload = { error: ui.self.chartRequestError } as T & { error?: string };
    if (text) {
      try {
        payload = JSON.parse(text) as T & { error?: string };
      } catch {
        payload = { error: text } as T & { error?: string };
      }
    }
    if (!response.ok) throw new Error(payload.error || ui.self.chartRequestError);
    return payload;
  }

  async function submitChartRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentError = stepError(activeStep);
    if (currentError) {
      setMessage(currentError);
      return;
    }
    if (!canSubmit) {
      goNext();
      return;
    }

    setIsSubmitting(true);
    setMessage(ui.self.chartRequestWorking);

    try {
      const body = {
        subjectName: form.subjectName.trim(),
        birthData: birthDataFor(form),
        question: optional(form.question),
        intent: optional(form.intent),
        context: parseContext(form),
        source: "self"
      };
      const chartPayload = await requestJson<{ request: ChartMakerRequest }>("/api/chart-requests", {
        method: "POST",
        body: JSON.stringify(body)
      });
      const reportPayload = await requestJson<{ request: AstrologyReportRequest }>("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          ...body,
          chartRequestId: chartPayload.request.id,
          reportType: "core_self"
        })
      });

      setRequests((current) => [chartPayload.request, ...current]);
      setReportRequests((current) => [reportPayload.request, ...current]);
      setForm(defaultForm(displayName));
      setActiveStep("subject");
      setMessage(ui.self.chartRequestQueued);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : ui.self.chartRequestError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function generateReport(requestId: string) {
    setGeneratingReportId(requestId);
    setMessage(ui.self.reportGenerateWorking);

    try {
      const payload = await requestJson<{ request: AstrologyReportRequest | null; result: AstrologyReportResult }>(
        `/api/reports/${encodeURIComponent(requestId)}/generate`,
        {
          method: "POST"
        }
      );

      if (payload.request) {
        setReportRequests((current) => current.map((request) => (request.id === payload.request?.id ? payload.request : request)));
      }
      setReportResults((current) => [payload.result, ...current.filter((result) => result.requestId !== payload.result.requestId)]);
      setSelectedReportRequestId(payload.result.requestId);
      setMessage(payload.result.status === "completed" ? ui.self.reportGenerateCompleted : ui.self.reportGenerateFailed);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : ui.self.reportGenerateError);
    } finally {
      setGeneratingReportId("");
    }
  }

  async function publishReportSignal(requestId: string) {
    setPublishingReportId(requestId);
    setMessage(ui.self.reportPublishWorking);

    try {
      await requestJson<{ artifact: unknown }>(`/api/reports/${encodeURIComponent(requestId)}/publish-signal`, {
        method: "POST"
      });
      setMessage(ui.self.reportPublishCompleted);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : ui.self.reportPublishError);
    } finally {
      setPublishingReportId("");
    }
  }

  return (
    <section className={styles.panel} aria-label={ui.self.chartRequestPanelLabel}>
      <article className="card">
        <div className="eyebrow">{ui.self.chartRequestEyebrow}</div>
        <h2>{ui.self.chartRequestTitle}</h2>
        <p>{ui.self.chartRequestIntro}</p>

        <div className={styles.stepper} aria-label={ui.self.onboardingStepsLabel}>
          {steps.map((step, index) => (
            <button
              aria-current={activeStep === step ? "step" : undefined}
              className={styles.step}
              key={step}
              onClick={() => goToStep(step)}
              type="button"
            >
              <span>{index + 1}</span>
              {ui.self.onboardingSteps[step]}
            </button>
          ))}
        </div>

        <form className={`auth-form ${styles.form}`} onSubmit={submitChartRequest}>
          {activeStep === "subject" ? (
            <>
              <label>
                <span>{ui.self.chartSubjectLabel}</span>
                <input value={form.subjectName} onChange={(event) => updateField("subjectName", event.target.value)} required />
              </label>
              <div className={styles.formGrid}>
                <label>
                  <span>{ui.self.onboardingRelationshipLabel}</span>
                  <input value={form.relationship} onChange={(event) => updateField("relationship", event.target.value)} />
                </label>
                <label>
                  <span>{ui.self.onboardingReasonLabel}</span>
                  <input value={form.reason} onChange={(event) => updateField("reason", event.target.value)} />
                </label>
              </div>
            </>
          ) : null}

          {activeStep === "birth_date" ? (
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
          ) : null}

          {activeStep === "precision" ? (
            <>
              <fieldset className={styles.optionGroup}>
                <legend>{ui.self.onboardingPrecisionModeLabel}</legend>
                <label className={styles.option}>
                  <input
                    checked={form.precisionMode === "date_only"}
                    name="precisionMode"
                    onChange={() => updateField("precisionMode", "date_only")}
                    type="radio"
                  />
                  <span>
                    <strong>{ui.self.onboardingDateOnlyPrecision}</strong>
                    {ui.self.onboardingDateOnlyPrecisionBody}
                  </span>
                </label>
                <label className={styles.option}>
                  <input
                    checked={form.precisionMode === "timed_location"}
                    name="precisionMode"
                    onChange={() => updateField("precisionMode", "timed_location")}
                    type="radio"
                  />
                  <span>
                    <strong>{ui.self.onboardingTimedPrecision}</strong>
                    {ui.self.onboardingTimedPrecisionBody}
                  </span>
                </label>
              </fieldset>
              {form.precisionMode === "timed_location" ? (
                <>
                  <div className={styles.placeSearch}>
                    <label>
                      <span>{ui.self.placeSearchLabel}</span>
                      <input
                        value={placeQuery}
                        onChange={(event) => setPlaceQuery(event.target.value)}
                        placeholder={ui.self.placeSearchPlaceholder}
                      />
                    </label>
                    <button className="button secondary" disabled={isSearchingPlaces} onClick={searchPlaces} type="button">
                      <Search aria-hidden="true" size={18} />
                      {isSearchingPlaces ? ui.self.placeSearchWorking : ui.self.placeSearchSubmit}
                    </button>
                  </div>
                  {placeMessage ? <p className="form-status" aria-live="polite">{placeMessage}</p> : null}
                  {placeResults.length ? (
                    <ul className={styles.placeResults} aria-label={ui.self.placeSearchResultsLabel}>
                      {placeResults.map((place) => (
                        <li key={place.id}>
                          <button onClick={() => selectPlace(place)} type="button">
                            <strong>{place.label}</strong>
                            <span>{place.timezone}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className={styles.formGrid}>
                    <label>
                      <span>{ui.self.chartTimeLabel}</span>
                      <input
                        value={form.time}
                        onChange={(event) => updateField("time", event.target.value)}
                        inputMode="numeric"
                        placeholder={ui.self.chartTimePlaceholder}
                      />
                    </label>
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
                  </div>
                  <label>
                    <span>{ui.self.chartLocationLabel}</span>
                    <input value={form.location} onChange={(event) => updateField("location", event.target.value)} />
                  </label>
                  <div className={styles.formGrid}>
                    <label>
                      <span>{ui.self.placeLatitudeLabel}</span>
                      <input value={form.latitude} onChange={(event) => updateField("latitude", event.target.value)} inputMode="decimal" />
                    </label>
                    <label>
                      <span>{ui.self.placeLongitudeLabel}</span>
                      <input value={form.longitude} onChange={(event) => updateField("longitude", event.target.value)} inputMode="decimal" />
                    </label>
                  </div>
                </>
              ) : null}
              <p className="form-status">{ui.self.chartPrecisionHint}</p>
            </>
          ) : null}

          {activeStep === "intent" ? (
            <>
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
            </>
          ) : null}

          {activeStep === "review" ? (
            <div className={styles.review} aria-label={ui.self.onboardingReviewLabel}>
              {reviewRows.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          ) : null}

          <div className={styles.formActions}>
            <button className="button secondary" disabled={activeStepIndex === 0 || isSubmitting} onClick={goBack} type="button">
              <ArrowLeft aria-hidden="true" size={18} />
              {ui.self.onboardingBack}
            </button>
            {canSubmit ? (
              <button className="button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Send aria-hidden="true" size={18} /> : <Check aria-hidden="true" size={18} />}
                {isSubmitting ? ui.self.chartRequestWorking : ui.self.chartRequestSubmit}
              </button>
            ) : (
              <button className="button" onClick={goNext} type="button">
                {ui.self.onboardingNext}
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            )}
          </div>
          {message ? <p className="form-status" aria-live="polite">{message}</p> : null}
        </form>
      </article>

      <aside className={styles.summaryRail}>
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
        <article className="card">
          <div className="eyebrow">{ui.self.reportRequestsStatusEyebrow}</div>
          <h2>{ui.self.reportRequestsStatusTitle}</h2>
          {reportRequests.length ? (
            <ul className={styles.requestList}>
              {reportRequests.slice(0, 5).map((request) => {
                const result = reportResultsByRequestId.get(request.id);
                return (
                  <li key={request.id}>
                    <div>
                      <span>{request.subjectName}</span>
                      {result?.publicSignal ? <small>{result.publicSignal.headline}</small> : null}
                    </div>
                    <div className={styles.statusActions}>
                      <strong>{request.status}</strong>
                      {result ? (
                        <button className="button secondary" onClick={() => setSelectedReportRequestId(result.requestId)} type="button">
                          <BookOpenText aria-hidden="true" size={16} />
                          {ui.self.reportReadCta}
                        </button>
                      ) : null}
                      {request.status === "queued" ? (
                        <button
                          className="button secondary"
                          disabled={generatingReportId === request.id}
                          onClick={() => generateReport(request.id)}
                          type="button"
                        >
                          <Sparkles aria-hidden="true" size={16} />
                          {generatingReportId === request.id ? ui.self.reportGenerateWorking : ui.self.reportGenerateCta}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>{ui.self.reportRequestsEmpty}</p>
          )}
        </article>
        <article className="card" aria-label={ui.self.reportReaderLabel}>
          <div className="eyebrow">{ui.self.reportReaderEyebrow}</div>
          <h2>{ui.self.reportReaderTitle}</h2>
          {selectedReportResult ? (
            <div className={styles.reportReader}>
              {selectedReportResult.publicSignal ? <strong>{selectedReportResult.publicSignal.headline}</strong> : null}
              {selectedReportResult.summary ? <p>{selectedReportResult.summary}</p> : null}
              {selectedReportResult.publicSignal ? (
                <button
                  className="button secondary"
                  disabled={publishingReportId === selectedReportResult.requestId}
                  onClick={() => publishReportSignal(selectedReportResult.requestId)}
                  type="button"
                >
                  <Send aria-hidden="true" size={16} />
                  {publishingReportId === selectedReportResult.requestId ? ui.self.reportPublishWorking : ui.self.reportPublishCta}
                </button>
              ) : null}
              <div className={styles.reportSections}>
                {selectedReportResult.sections.map((section) => (
                  <section key={section.id}>
                    <span>{ui.self.reportSectionEmphasis(section.emphasis)}</span>
                    <h3>{section.title}</h3>
                    <p>{section.body}</p>
                  </section>
                ))}
              </div>
              <details>
                <summary>{ui.self.reportProvenanceTitle}</summary>
                <ul className={styles.provenanceList}>
                  {selectedReportResult.provenance.map((entry) => (
                    <li key={entry.id}>
                      <strong>{entry.label}</strong>
                      <span>{entry.summary}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ) : (
            <p>{ui.self.reportReaderEmpty}</p>
          )}
        </article>
      </aside>
    </section>
  );
}
