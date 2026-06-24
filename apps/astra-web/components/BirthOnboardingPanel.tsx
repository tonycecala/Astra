"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenText, Check, Search, Send } from "lucide-react";
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
const steps = ["subject", "precision", "review"] as const;

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
  date: string;
  precisionMode: PrecisionMode;
  time: string;
  timezone: string;
  location: string;
};

const defaultForm = (displayName: string): FormState => ({
  subjectName: displayName,
  date: "",
  precisionMode: "date_only",
  time: "",
  timezone: "",
  location: ""
});

function optional(value: string) {
  const clean = value.trim();
  return clean ? clean : undefined;
}

function birthDataFor(form: FormState) {
  const birthData = {
    date: form.date,
    time: form.precisionMode === "timed_location" ? optional(form.time) : undefined,
    timezone: form.precisionMode === "timed_location" ? optional(form.timezone) : undefined,
    location: form.precisionMode === "timed_location" ? optional(form.location) : undefined
  };
  return Object.fromEntries(Object.entries(birthData).filter(([, value]) => value !== undefined));
}

function stepIndex(step: Step) {
  return steps.indexOf(step);
}

function reportStatusLabel(status: string) {
  if (status === "queued" || status === "processing") {
    return ui.self.reportStatusGenerating;
  }

  if (status === "completed") {
    return ui.self.reportStatusReady;
  }

  if (status === "failed") {
    return ui.self.reportStatusFailed;
  }

  if (status === "cancelled") {
    return ui.self.reportStatusCancelled;
  }

  return status;
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
  const [message, setMessage] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<BirthPlaceSearchResult[]>([]);
  const [placeMessage, setPlaceMessage] = useState("");
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [hasSelectedPlace, setHasSelectedPlace] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false);

  const activeStepIndex = stepIndex(activeStep);
  const isWizardComplete = isSubmissionComplete;
  const canSubmit = activeStep === "review" && !isWizardComplete;
  const progressPercent = isWizardComplete ? 100 : Math.round(((activeStepIndex + 1) / steps.length) * 100);
  const reviewRows = useMemo(
    () => [
      [ui.self.onboardingReviewSubject, form.subjectName || ui.self.onboardingReviewMissing],
      [ui.self.onboardingReviewBirthDate, form.date || ui.self.onboardingReviewMissing],
      [
        ui.self.onboardingReviewPrecision,
        form.precisionMode === "timed_location"
          ? `${form.time || ui.self.onboardingReviewMissing}, ${form.timezone || ui.self.onboardingReviewMissing}, ${form.location || ui.self.onboardingReviewMissing}`
          : ui.self.onboardingDateOnlyPrecision
      ]
    ],
    [form]
  );
  const reportResultsByRequestId = useMemo(
    () => new Map(reportResults.map((result) => [result.requestId, result])),
    [reportResults]
  );
  const hasCompletedReport = reportResults.some((result) => result.status === "completed");
  const flowStages = [
    { label: ui.self.chartFlowBirthData, isDone: requests.length > 0 },
    { label: ui.self.chartFlowChart, isDone: requests.length > 0 },
    { label: ui.self.chartFlowReport, isDone: hasCompletedReport },
    { label: ui.self.chartFlowLibrary, isDone: hasCompletedReport }
  ];

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function selectPlace(place: BirthPlaceSearchResult) {
    setForm((current) => ({
      ...current,
      location: place.label,
      timezone: place.timezone
    }));
    setHasSelectedPlace(true);
    setPlaceResults([]);
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
    if (step === "precision" && !/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return ui.self.onboardingDateRequired;
    if (step === "precision" && form.precisionMode === "timed_location") {
      if (!optional(form.time) || !optional(form.timezone) || !optional(form.location)) {
        return ui.self.onboardingPrecisionRequired;
      }
      if (!/^\d{2}:\d{2}$/.test(form.time)) return ui.self.onboardingTimeRequired;
    }
    return "";
  }

  function goToStep(nextStep: Step) {
    if (isWizardComplete) return;
    const currentError = stepError(activeStep);
    if (stepIndex(nextStep) > activeStepIndex && currentError) {
      setMessage(currentError);
      return;
    }
    setActiveStep(nextStep);
    setMessage("");
  }

  function goNext() {
    if (isWizardComplete) return;
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
    if (isWizardComplete) return;
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
    if (isWizardComplete) return;
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
    setIsSubmissionComplete(false);
    setMessage(ui.self.chartRequestWorking);

    try {
      const body = {
        subjectName: form.subjectName.trim(),
        birthData: birthDataFor(form),
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
      setActiveStep("review");
      setIsSubmissionComplete(true);
      setMessage(ui.self.chartRequestQueued);
      await generateReport(reportPayload.request.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : ui.self.chartRequestError);
    } finally {
      setIsSubmitting(false);
    }
  }

  function startAnotherOnboarding() {
    setIsSubmissionComplete(false);
    setActiveStep("subject");
    setMessage("");
    setPlaceResults([]);
    setPlaceMessage("");
    setPlaceQuery("");
    setHasSelectedPlace(false);
    setForm(defaultForm(displayName));
  }

  function openReportArtifact(requestId: string) {
    window.location.assign(`/library?reportId=${encodeURIComponent(requestId)}`);
  }

  async function generateReport(requestId: string) {
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
      setMessage(payload.result.status === "completed" ? ui.self.reportGenerateCompleted : ui.self.reportGenerateFailed);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : ui.self.reportGenerateError);
    } finally {
    }
  }

  return (
    <section className={styles.panel} aria-label={ui.self.chartRequestPanelLabel}>
      <article className="card">
        <div className="eyebrow">{ui.self.chartRequestEyebrow}</div>
        <h2>{ui.self.chartRequestTitle}</h2>
        <p>{ui.self.chartRequestIntro}</p>
        <div className={styles.alphaGuide} aria-label={ui.self.onboardingGuideLabel}>
          <strong>{ui.self.onboardingGuideTitle}</strong>
          <span>{ui.self.onboardingGuideBody}</span>
        </div>

        <div className={styles.stepper} aria-label={ui.self.onboardingStepsLabel}>
          {steps.map((step, index) => (
            <button
              aria-current={activeStep === step ? "step" : undefined}
              className={styles.step}
              key={step}
              disabled={isWizardComplete}
              onClick={() => goToStep(step)}
              type="button"
            >
              <span>{index + 1}</span>
              {ui.self.onboardingSteps[step]}
            </button>
          ))}
        </div>
        <div className={styles.progressTrack} role="progressbar" aria-valuemax={100} aria-valuemin={0} aria-valuenow={progressPercent} aria-label={ui.self.onboardingStepsLabel}>
          <span className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>
        <p className={styles.progressText} aria-live="polite">
          {isWizardComplete
            ? ui.self.onboardingProgressQueued
            : ui.self.onboardingProgress(activeStepIndex + 1, steps.length, ui.self.onboardingSteps[activeStep])}
        </p>
        <ol className={styles.flowMap} aria-label={ui.self.chartFlowLabel}>
          {flowStages.map((stage, index) => (
            <li className={stage.isDone ? styles.flowDone : undefined} key={stage.label}>
              <span>{stage.isDone ? <Check aria-hidden="true" size={14} /> : index + 1}</span>
              {stage.label}
            </li>
          ))}
        </ol>

        <form className={`auth-form ${styles.form}`} onSubmit={submitChartRequest}>
          {activeStep === "subject" ? (
            <label>
              <span>{ui.self.chartSubjectLabel}</span>
              <input value={form.subjectName} onChange={(event) => updateField("subjectName", event.target.value)} required />
            </label>
          ) : null}

          {activeStep === "precision" ? (
            <>
              <div className={styles.alphaGuide}>
                <strong>{ui.self.onboardingPrecisionGuideTitle}</strong>
                <span>{ui.self.onboardingPrecisionGuideBody}</span>
              </div>
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
              <fieldset className={styles.optionGroup}>
                <legend>{ui.self.onboardingPrecisionModeLabel}</legend>
                <label className={styles.option}>
                  <input
                    checked={form.precisionMode === "date_only"}
                    name="precisionMode"
                    onChange={() => {
                      setHasSelectedPlace(false);
                      updateField("precisionMode", "date_only");
                    }}
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
                    onChange={() => {
                      setHasSelectedPlace(false);
                      updateField("precisionMode", "timed_location");
                    }}
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
                        onChange={(event) => {
                          setHasSelectedPlace(false);
                          setPlaceQuery(event.target.value);
                        }}
                        placeholder={ui.self.placeSearchPlaceholder}
                      />
                    </label>
                    <button className="button secondary" disabled={isSearchingPlaces} onClick={searchPlaces} type="button">
                      <Search aria-hidden="true" size={18} />
                      {isSearchingPlaces ? ui.self.placeSearchWorking : ui.self.placeSearchSubmit}
                    </button>
                  </div>
                  {placeMessage ? <p className="form-status" aria-live="polite">{placeMessage}</p> : null}
                  {placeResults.length > 0 && !hasSelectedPlace ? (
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
                  {hasSelectedPlace && form.location && form.timezone ? (
                    <p className="form-status" aria-live="polite">
                      {ui.self.placeSearchSelected(form.location)} ({form.timezone.replaceAll("_", " ")})
                    </p>
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
                    <input
                      value={form.location}
                      onChange={(event) => {
                        setHasSelectedPlace(false);
                        updateField("location", event.target.value);
                      }}
                    />
                  </label>
                </>
              ) : null}
              <p className="form-status">{ui.self.chartPrecisionHint}</p>
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
            <button
              className="button secondary"
              disabled={activeStepIndex === 0 || isSubmitting || isWizardComplete}
              onClick={goBack}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={18} />
              {ui.self.onboardingBack}
            </button>
            {canSubmit ? (
              <button className="button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Send aria-hidden="true" size={18} /> : <Check aria-hidden="true" size={18} />}
                {isSubmitting ? ui.self.chartRequestWorking : ui.self.chartRequestSubmit}
              </button>
            ) : isWizardComplete ? (
              <div className={styles.completionActions}>
                <button className={`${styles.buttonDone} button`} type="button" disabled>
                  <Check aria-hidden="true" size={18} />
                  {ui.self.chartRequestQueued}
                </button>
                <button className="button secondary" onClick={startAnotherOnboarding} type="button">
                  {ui.self.chartRequestStartOver}
                </button>
              </div>
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
                  <strong>{reportStatusLabel(request.status)}</strong>
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
                      <strong>{reportStatusLabel(request.status)}</strong>
                      {result ? (
                        <button className="button secondary" onClick={() => openReportArtifact(request.id)} type="button">
                          <BookOpenText aria-hidden="true" size={16} />
                          {ui.self.reportReadCta}
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
      </aside>
    </section>
  );
}
