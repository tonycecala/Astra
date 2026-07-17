"use client";

import Link from "next/link";
import { type CSSProperties, FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenText, Check, Search, Send } from "lucide-react";
import {
  chartCalculationModeForBirthData,
  type Ally,
  AstrologyReportRequest,
  AstrologyReportResult,
  BirthPlaceSearchResult,
  ChartBirthData,
  ChartMakerRequest,
  OrderableAstrologyReportType
} from "@astra/contracts";
import { displayTimezone } from "../lib/display";
import { ui } from "../lib/i18n";
import { REPORT_PRODUCT_ORDER, reportProductFor } from "../lib/reportCatalog";
import { BirthDateTimeSheet } from "./BirthDateTimeSheet";
import {
  type BirthDateTimeValue,
  defaultBrowserTimezone,
  formatDisplayTime,
  formatReadableDateOnly,
  isFutureDateOnly,
  isValidDateOnly,
  isValidTimeOnly
} from "./BirthDateTimeSheet.helpers";
import styles from "./BirthOnboardingPanel.module.css";

function supportedTimeZones() {
  if (typeof Intl.supportedValuesOf !== "function") {
    throw new Error("Intl.supportedValuesOf is required for timezone selection.");
  }

  return Intl.supportedValuesOf("timeZone");
}

const timeZones = supportedTimeZones();
const steps = ["subject", "birth_details", "report"] as const;

const confirmLayerStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 90,
  display: "grid",
  placeItems: "center",
  padding: 20,
  background: "color-mix(in srgb, #02030a 62%, transparent)",
  backdropFilter: "blur(12px)"
};

const confirmDialogStyle: CSSProperties = {
  width: "min(390px, 100%)",
  maxHeight: "calc(100dvh - 40px)",
  overflowY: "auto",
  overscrollBehavior: "contain",
  border: "1px solid color-mix(in srgb, var(--gold) 32%, var(--line))",
  borderRadius: 8,
  padding: 14,
  background:
    "radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--gold) 12%, transparent), transparent 38%), var(--panel)",
  boxShadow: "0 24px 80px color-mix(in srgb, #000 52%, transparent)"
};

const confirmActionsStyle: CSSProperties = {
  position: "sticky",
  bottom: -14,
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  margin: "12px -14px -14px",
  padding: "10px 14px 14px",
  borderTop: "1px solid var(--line)",
  background: "var(--panel)"
};

type Step = (typeof steps)[number];
type ReportType = OrderableAstrologyReportType;
type ZodiacMode = "tropical" | "sidereal";
type HouseSystemMode = "whole-sign" | "placidus";

type BirthOnboardingPanelProps = {
  displayName: string;
  role?: string;
  starBalance?: number;
  initialRequests: ChartMakerRequest[];
  initialReportRequests: AstrologyReportRequest[];
  initialReportResults: AstrologyReportResult[];
  subjectType?: "self" | "ally";
  initialAllies?: Ally[];
  initialBirthData?: ChartBirthData;
  initialChartRequestId?: string;
  initialStep?: Step;
  hideRecentRequestPanels?: boolean;
  hideSummaryRail?: boolean;
};

type FormState = {
  subjectName: string;
  relationship: string;
  note: string;
  reportType: ReportType;
  zodiacMode: ZodiacMode;
  houseSystem: HouseSystemMode;
  useKimiIntro: boolean;
  synastryPartnerChartRequestId: string;
  progressedAsOfDate: string;
  date: string;
  time: string;
  timezone: string;
  birthTimeKnown: boolean;
  location: string;
  latitude?: number;
  longitude?: number;
};

function chartSubjectContext(chartRequest?: ChartMakerRequest) {
  const subject = chartRequest?.context?.subject;
  return subject && typeof subject === "object" && !Array.isArray(subject)
    ? subject as { relationship?: unknown; note?: unknown }
    : undefined;
}

function localDateOnly() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

const defaultForm = (displayName: string, birthData?: ChartBirthData, chartRequest?: ChartMakerRequest): FormState => ({
  subjectName: chartRequest?.subjectName ?? displayName,
  relationship: typeof chartSubjectContext(chartRequest)?.relationship === "string" ? chartSubjectContext(chartRequest)?.relationship as string : "",
  note: typeof chartSubjectContext(chartRequest)?.note === "string" ? chartSubjectContext(chartRequest)?.note as string : "",
  reportType: "identity",
  zodiacMode: "tropical",
  houseSystem: "whole-sign",
  useKimiIntro: false,
  synastryPartnerChartRequestId: "",
  progressedAsOfDate: localDateOnly(),
  date: chartRequest?.birthData.date ?? birthData?.date ?? "",
  time: chartRequest?.birthData.time ?? birthData?.time ?? "",
  timezone: chartRequest?.birthData.timezone ?? birthData?.timezone ?? defaultBrowserTimezone(),
  birthTimeKnown: chartRequest?.birthData.birthTimeKnown ?? birthData?.birthTimeKnown ?? true,
  location: chartRequest?.birthData.location ?? birthData?.location ?? "",
  latitude: chartRequest?.birthData.latitude ?? birthData?.latitude,
  longitude: chartRequest?.birthData.longitude ?? birthData?.longitude
});

function optional(value: string) {
  const clean = value.trim();
  return clean ? clean : undefined;
}

function reportRequestErrorMessage(code?: string) {
  if (code === "INSUFFICIENT_STARS") return ui.self.reportConfirmInsufficient;
  if (code === "INVALID_REPORT_BASIS") return ui.self.reportBasisInvalid;
  if (code === "INVALID_CHART_REQUEST") return ui.self.reportRequestInvalid;
  if (code === "INVALID_ASTROLOGY_REPORT_REQUEST") return ui.self.reportRequestInvalid;
  if (code === "AUTH_REQUIRED") return ui.self.reportAuthRequired;
  return "";
}

function birthDataFor(form: FormState) {
  const knownTime = form.birthTimeKnown;
  const birthData = {
    date: form.date,
    birthTimeKnown: knownTime,
    time: knownTime ? optional(form.time) : undefined,
    timezone: optional(form.timezone),
    location: optional(form.location),
    latitude: optional(form.location) ? form.latitude : undefined,
    longitude: optional(form.location) ? form.longitude : undefined
  };
  return Object.fromEntries(Object.entries(birthData).filter(([, value]) => value !== undefined));
}

function birthDataMatchesForm(birthData: ChartBirthData | undefined, form: FormState) {
  if (!birthData) return false;
  const knownTime = birthData.birthTimeKnown ?? Boolean(birthData.time);
  return (
    birthData.date === form.date &&
    knownTime === form.birthTimeKnown &&
    (birthData.time ?? "") === (form.birthTimeKnown ? form.time : "") &&
    (birthData.timezone ?? "") === form.timezone &&
    (birthData.location ?? "") === form.location &&
    birthData.latitude === form.latitude &&
    birthData.longitude === form.longitude
  );
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

function reportTypeLabel(reportType: AstrologyReportRequest["reportType"]) {
  if (reportType === "identity") return ui.library.reportTypeIdentity;
  if (reportType === "deep") return ui.library.reportTypeDeep;
  if (reportType === "progressed") return ui.library.reportTypeProgressed;
  if (reportType === "synastry") return ui.library.reportTypeSynastry;
  return ui.library.reportTypeCore;
}

function reportTypeCost(reportType: ReportType) {
  return reportProductFor(reportType).costStars;
}

function reportBasisLabel(reportType: ReportType) {
  return ui.self.reportBasisTypes[reportProductFor(reportType).basis];
}

function chartSubjectType(request: ChartMakerRequest) {
  return request.context?.subject?.subjectType ?? (request.source === "ally" ? "ally" : "self");
}

function compactBirthLine(birthData?: ChartBirthData) {
  if (!birthData?.date) return ui.self.noBirthData;
  return [
    birthData.date,
    birthData.birthTimeKnown === false ? ui.self.birthMomentUnknownTimeShort : birthData.time,
    birthData.location
  ].filter(Boolean).join(" · ");
}

function compactFormBirthLine(form: FormState) {
  if (!form.date) return ui.self.noBirthData;
  return [
    form.date,
    form.birthTimeKnown ? form.time : ui.self.birthMomentUnknownTimeShort,
    form.location
  ].filter(Boolean).join(" · ");
}

function birthMomentValueFor(form: FormState): BirthDateTimeValue {
  return {
    date: form.date,
    time: form.birthTimeKnown ? form.time || null : null,
    timezone: form.timezone,
    birthTimeKnown: form.birthTimeKnown
  };
}

function birthMomentSummary(form: FormState) {
  if (!form.date) return ui.self.birthMomentNotSelected;
  const parts = [formatReadableDateOnly(form.date) || form.date];
  if (form.birthTimeKnown) {
    parts.push(formatDisplayTime(form.time) || form.time || ui.self.onboardingReviewMissing);
  } else {
    parts.push(ui.self.birthMomentUnknownTimeShort);
  }
  if (form.timezone) parts.push(displayTimezone(form.timezone));
  return parts.filter(Boolean).join(" · ");
}

function chartSubjectId(request: ChartMakerRequest) {
  const subject = request.context?.subject as { allyId?: string; subjectId?: string } | undefined;
  return subject?.allyId ?? subject?.subjectId;
}

export function BirthOnboardingPanel({
  displayName,
  role = "customer",
  starBalance = 0,
  initialRequests,
  initialReportRequests,
  initialReportResults = [],
  subjectType = "self",
  initialAllies = [],
  initialBirthData,
  initialChartRequestId,
  initialStep,
  hideRecentRequestPanels = false,
  hideSummaryRail = false
}: BirthOnboardingPanelProps) {
  const initialChartRequest = initialChartRequestId
    ? initialRequests.find((request) => request.id === initialChartRequestId)
    : undefined;
  const [form, setForm] = useState<FormState>(() => defaultForm(displayName, initialBirthData, initialChartRequest));
  const [allies, setAllies] = useState(initialAllies);
  const [activeStep, setActiveStep] = useState<Step>(() => (initialChartRequest ? initialStep ?? "report" : initialStep ?? "subject"));
  const [selectedExistingChartRequestId, setSelectedExistingChartRequestId] = useState(initialChartRequest?.id ?? "");
  const [requests, setRequests] = useState(initialRequests);
  const [reportRequests, setReportRequests] = useState(initialReportRequests);
  const [, setReportResults] = useState(initialReportResults);
  const [message, setMessage] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<BirthPlaceSearchResult[]>([]);
  const [placeMessage, setPlaceMessage] = useState("");
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [hasSelectedPlace, setHasSelectedPlace] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false);
  const [isConfirmingReport, setIsConfirmingReport] = useState(false);
  const [isBirthMomentSheetOpen, setIsBirthMomentSheetOpen] = useState(false);

  const isAlly = subjectType === "ally";
  const isAdmin = role === "admin";
  const synastryChartOptions = useMemo(
    () => requests.filter((request) =>
      request.birthData.date &&
      request.id !== selectedExistingChartRequestId &&
      (isAdmin || chartSubjectType(request) !== subjectType)
    ),
    [isAdmin, requests, selectedExistingChartRequestId, subjectType]
  );
  const availableReportTypes = REPORT_PRODUCT_ORDER;
  const panelCopy = isAlly ? ui.allies.wizard : ui.self;
  const isWizardComplete = isSubmissionComplete;
  const canSubmit = activeStep === "report" && !isWizardComplete;
  const selectedReportCost = form.useKimiIntro ? 0 : reportTypeCost(form.reportType);
  const balanceAfterReport = starBalance - selectedReportCost;
  const canAffordSelectedReport = isAdmin || balanceAfterReport >= 0;
  const existingChartRequest = selectedExistingChartRequestId
    ? requests.find((request) => request.id === selectedExistingChartRequestId)
    : undefined;
  const isUsingExistingChart = Boolean(existingChartRequest);
  const isExistingChartOrderMode = isAlly && isUsingExistingChart;
  const isExistingChartLocked = isExistingChartOrderMode;
  const visibleSteps: readonly Step[] = isExistingChartOrderMode ? ["report"] : isUsingExistingChart ? ["birth_details", "report"] : steps;
  const visibleStepIndex = visibleSteps.indexOf(activeStep);
  const displayedStepIndex = visibleStepIndex >= 0 ? visibleStepIndex : 0;
  const isSingleStepFlow = visibleSteps.length === 1;
  const synastryPartner = useMemo(
    () => synastryChartOptions.find((request) => request.id === form.synastryPartnerChartRequestId),
    [form.synastryPartnerChartRequestId, synastryChartOptions]
  );
  const previewBirthData = isExistingChartLocked && existingChartRequest
    ? existingChartRequest.birthData
    : birthDataFor(form);
  const hasHouseCalculation = chartCalculationModeForBirthData(previewBirthData) === "full";
  const reviewRows = useMemo(
    () => [
      [ui.self.onboardingReviewName, form.subjectName || ui.self.onboardingReviewMissing],
      [ui.self.onboardingReviewReportType, reportTypeLabel(form.reportType)],
      ...(form.useKimiIntro ? ([[ui.self.reportConfirmOffer, ui.self.kimiIntroDeepOffer]] as const) : []),
      [ui.self.reportConfirmBasis, reportBasisLabel(form.reportType)],
      [ui.self.zodiacModeLabel, ui.self.zodiacModes[form.zodiacMode]],
      [ui.self.houseSystemLabel, hasHouseCalculation ? ui.self.houseSystems[form.houseSystem] : ui.self.houseSystemUnavailable],
      ...(form.reportType === "progressed"
        ? ([[ui.self.progressedAsOfLabel, form.progressedAsOfDate]] as const)
        : []),
      ...(form.reportType === "synastry"
        ? ([[ui.self.onboardingReviewSynastryPartner, synastryPartner?.subjectName ?? ui.self.onboardingReviewMissing]] as const)
        : []),
      [ui.self.reportConfirmCost, ui.stars.reportCost(selectedReportCost)],
      [ui.self.reportConfirmBalance, ui.stars.balance(starBalance)]
    ],
    [form, hasHouseCalculation, selectedReportCost, starBalance, synastryPartner]
  );
  const chartRequestsBySubjectId = useMemo(() => {
    const indexed = new Map<string, ChartMakerRequest>();
    for (const request of requests) {
      const subjectId = chartSubjectId(request);
      if (subjectId && !indexed.has(subjectId)) {
        indexed.set(subjectId, request);
      }
    }
    return indexed;
  }, [requests]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setIsConfirmingReport(false);
    setMessage("");
  }

  function applyBirthMoment(nextValue: BirthDateTimeValue) {
    setForm((current) => ({
      ...current,
      date: nextValue.date,
      time: nextValue.birthTimeKnown ? nextValue.time ?? "" : "",
      timezone: nextValue.timezone,
      birthTimeKnown: nextValue.birthTimeKnown
    }));
    setIsBirthMomentSheetOpen(false);
    setIsConfirmingReport(false);
    setMessage("");
  }

  function selectReportType(reportType: ReportType) {
    setForm((current) => ({
      ...current,
      reportType,
      useKimiIntro: false,
      synastryPartnerChartRequestId: reportType === "synastry" ? current.synastryPartnerChartRequestId : ""
    }));
    setIsConfirmingReport(false);
    setMessage("");
  }

  function selectKimiIntro(useKimiIntro: boolean) {
    setForm((current) => ({
      ...current,
      useKimiIntro,
      reportType: useKimiIntro ? "identity" : current.reportType,
      synastryPartnerChartRequestId: useKimiIntro ? "" : current.synastryPartnerChartRequestId
    }));
    setIsConfirmingReport(false);
    setMessage("");
  }

  function selectPlace(place: BirthPlaceSearchResult) {
    setForm((current) => ({
      ...current,
      location: place.label,
      timezone: place.timezone,
      latitude: place.latitude,
      longitude: place.longitude
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
    if (step === "subject" && isAlly && !optional(form.relationship)) return ui.allies.wizardRelationshipRequired;
    if (step === "report" && form.reportType === "synastry" && !optional(form.synastryPartnerChartRequestId)) {
      return ui.self.onboardingSynastryPartnerRequired;
    }
    if (step === "report" && form.reportType === "progressed") {
      if (!form.birthTimeKnown || !optional(form.time)) return ui.self.onboardingProgressedTimeRequired;
      if (!isValidDateOnly(form.progressedAsOfDate)) return ui.self.onboardingProgressedDateRequired;
      if (form.progressedAsOfDate < form.date) return ui.self.onboardingProgressedDateBeforeBirth;
    }
    if (step === "birth_details" && !isValidDateOnly(form.date)) return ui.self.birthMomentDateRequired;
    if (step === "birth_details" && isFutureDateOnly(form.date)) return ui.self.birthMomentFutureDate;
    if (step === "birth_details") {
      if (!optional(form.timezone)) return ui.self.birthMomentTimezoneRequired;
      if (form.birthTimeKnown) {
        if (!optional(form.time)) return ui.self.birthMomentTimeRequired;
        if (!isValidTimeOnly(form.time)) return ui.self.birthMomentTimeInvalid;
      }
    }
    return "";
  }

  function goToStep(nextStep: Step) {
    if (isWizardComplete) return;
    const currentError = stepError(activeStep);
    const nextVisibleIndex = visibleSteps.indexOf(nextStep);
    if (nextVisibleIndex > displayedStepIndex && currentError) {
      setMessage(currentError);
      return;
    }
    setActiveStep(nextStep);
    setIsConfirmingReport(false);
    setMessage("");
  }

  function stepLabel(step: Step) {
    return isAlly && step === "subject" ? ui.allies.wizard.subjectStepLabel : ui.self.onboardingSteps[step];
  }

  function goNext() {
    if (isWizardComplete) return;
    const currentError = stepError(activeStep);
    if (currentError) {
      setMessage(currentError);
      return;
    }

    const next = visibleSteps[displayedStepIndex + 1];
    if (next) {
      setActiveStep(next);
      setIsConfirmingReport(false);
      setMessage("");
    }
  }

  function goBack() {
    if (isWizardComplete) return;
    const previous = visibleSteps[displayedStepIndex - 1];
    if (previous) {
      setActiveStep(previous);
      setIsConfirmingReport(false);
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
    let payload = { error: ui.self.chartRequestError } as T & { error?: string; message?: string };
    if (text) {
      try {
        payload = JSON.parse(text) as T & { error?: string; message?: string };
      } catch {
        payload = { error: text } as T & { error?: string };
      }
    }
    if (!response.ok) throw new Error(reportRequestErrorMessage(payload.error) || payload.message || payload.error || ui.self.chartRequestError);
    return payload;
  }

  async function createAllyRecord() {
    const payload = await requestJson<{ ally: Ally }>("/api/allies", {
      method: "POST",
      body: JSON.stringify({
        name: form.subjectName.trim(),
        kind: "person",
        relationship: form.relationship.trim(),
        note: optional(form.note)
      })
    });
    setAllies((current) => [payload.ally, ...current]);
    return payload.ally;
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

    setIsConfirmingReport(true);
  }

  async function submitConfirmedReport() {
    if (isWizardComplete || isSubmitting) return;
    const currentError = stepError(activeStep);
    if (currentError) {
      setIsConfirmingReport(false);
      setMessage(currentError);
      return;
    }

    setIsConfirmingReport(false);
    setIsSubmitting(true);
    setIsSubmissionComplete(false);
    setMessage(ui.self.chartRequestWorking);

    try {
      const ally = !existingChartRequest && isAlly ? await createAllyRecord() : undefined;
      const subjectContext = {
        ...(existingChartRequest?.context?.subject ?? {}),
        subjectType,
        subjectId: ally?.id ?? existingChartRequest?.context?.subject?.subjectId,
        allyId: ally?.id ?? existingChartRequest?.context?.subject?.allyId,
        displayName: form.subjectName.trim(),
        relationship: ally?.relationship ?? existingChartRequest?.context?.subject?.relationship,
        note: ally?.note ?? existingChartRequest?.context?.subject?.note
      };
      const chartSettings = {
        zodiacMode: form.zodiacMode,
        houseSystem: form.houseSystem
      };
      const canReuseExistingChart = Boolean(existingChartRequest && (isExistingChartLocked || birthDataMatchesForm(existingChartRequest.birthData, form)));
      const reportBirthData = canReuseExistingChart && existingChartRequest ? existingChartRequest.birthData : birthDataFor(form);
      const chartBody = {
        subjectName: form.subjectName.trim(),
        birthData: reportBirthData,
        source: subjectType,
        context: {
          subject: subjectContext,
          chartSettings
        }
      };
      let chartRequest: ChartMakerRequest;
      if (canReuseExistingChart && existingChartRequest) {
        chartRequest = existingChartRequest;
      } else {
        chartRequest = (await requestJson<{ request: ChartMakerRequest }>("/api/chart-requests", {
          method: "POST",
          body: JSON.stringify(chartBody)
        })).request;
      }
      const basisType = reportProductFor(form.reportType).basis;
      const reportBasis = basisType === "progressed"
        ? { type: basisType, chartSettings, asOfDate: form.progressedAsOfDate }
        : basisType === "synastry"
          ? { type: basisType, chartSettings, partnerChartRequestId: form.synastryPartnerChartRequestId }
          : { type: basisType, chartSettings };
      const reportPayload = await requestJson<{ request: AstrologyReportRequest }>("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          chartRequestId: chartRequest.id,
          reportType: form.reportType,
          ...(form.useKimiIntro ? { kimiIntro: true } : {}),
          reportBasis
        })
      });

      if (!canReuseExistingChart) {
        setRequests((current) => [chartRequest, ...current]);
      }
      setReportRequests((current) => [reportPayload.request, ...current]);
      setActiveStep("report");
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
    setIsConfirmingReport(false);
    setIsBirthMomentSheetOpen(false);
    setSelectedExistingChartRequestId("");
    setForm(defaultForm(displayName, initialBirthData));
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
      if (payload.result.status === "completed") {
        openReportArtifact(payload.result.requestId);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : ui.self.reportGenerateError);
    }
  }

  return (
    <section className={styles.panel} aria-label={panelCopy.chartRequestPanelLabel}>
      <article className="card">
        {!isAlly && !isExistingChartOrderMode ? <div className="eyebrow">{panelCopy.chartRequestEyebrow}</div> : null}
        <h2>{isAlly ? ui.allies.wizard.chartRequestExistingTitle : panelCopy.chartRequestTitle}</h2>
        {!isAlly && !isExistingChartOrderMode ? <p>{panelCopy.chartRequestIntro}</p> : null}

        {!isSingleStepFlow ? (
          <div
            className={styles.stepper}
            aria-label={ui.self.onboardingStepsLabel}
            style={{ display: "grid", gap: 8, gridTemplateColumns: `repeat(${visibleSteps.length}, minmax(0, 1fr))`, marginTop: 18 }}
          >
            {visibleSteps.map((step, index) => (
              <button
                aria-current={activeStep === step ? "step" : undefined}
                className={styles.step}
                key={step}
                disabled={isWizardComplete}
                onClick={() => goToStep(step)}
                style={{
                  background: "transparent",
                  border: 0,
                  borderRadius: 0,
                  color: activeStep === step ? "var(--gold)" : "var(--muted)",
                  display: "grid",
                  fontSize: "0.8rem",
                  fontWeight: 760,
                  gap: 7,
                  justifyItems: "center",
                  minHeight: 36,
                  padding: 0
                }}
                type="button"
              >
                <span
                  style={{
                    background: activeStep === step ? "var(--gold)" : "color-mix(in srgb, var(--muted) 24%, transparent)",
                    borderRadius: 999,
                    color: "transparent",
                    display: "block",
                    fontSize: 0,
                    height: 5,
                    width: "100%"
                  }}
                >
                  {index + 1}
                </span>
                {stepLabel(step)}
              </button>
            ))}
          </div>
        ) : null}
        <form className={`auth-form ${styles.form}`} onSubmit={submitChartRequest}>
          {!isSingleStepFlow ? (
            <p className={styles.progressText} aria-live="polite">
              {isWizardComplete
                ? ui.self.onboardingProgressQueued
                : ui.self.onboardingProgress(displayedStepIndex + 1, visibleSteps.length, stepLabel(activeStep))}
            </p>
          ) : null}
          <div className={`${styles.formActions} ${isSingleStepFlow ? styles.formActionsSingle : ""}`}>
            {!isSingleStepFlow ? (
              <button
                className="button secondary"
                disabled={displayedStepIndex === 0 || isSubmitting || isWizardComplete}
                onClick={(event) => {
                  event.preventDefault();
                  goBack();
                }}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={18} />
                {ui.self.onboardingBack}
              </button>
            ) : null}
            {canSubmit ? (
              <button className="button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Send aria-hidden="true" size={18} /> : null}
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
              <button
                className="button"
                onClick={(event) => {
                  event.preventDefault();
                  goNext();
                }}
                type="button"
              >
                {ui.self.onboardingNext}
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            )}
          </div>
          {activeStep === "subject" ? (
            <div className={styles.subjectFields}>
              <label>
                <span>{panelCopy.chartSubjectLabel}</span>
                <input
                  disabled={isExistingChartLocked}
                  readOnly={isExistingChartLocked}
                  value={form.subjectName}
                  onChange={(event) => updateField("subjectName", event.target.value)}
                  required
                />
              </label>
              {isAlly ? (
                <>
                  <label>
                    <span>{ui.allies.wizardRelationshipLabel}</span>
                    <input
                      disabled={isExistingChartLocked}
                      readOnly={isExistingChartLocked}
                      value={form.relationship}
                      onChange={(event) => updateField("relationship", event.target.value)}
                      required={!isExistingChartLocked}
                    />
                  </label>
                  <label>
                    <span>{ui.allies.wizardNoteLabel}</span>
                    <textarea
                      disabled={isExistingChartLocked}
                      readOnly={isExistingChartLocked}
                      value={form.note}
                      onChange={(event) => updateField("note", event.target.value)}
                      rows={3}
                    />
                  </label>
                </>
              ) : null}
            </div>
          ) : null}

          {activeStep === "report" ? (
            <div className={styles.subjectFields}>
              {isUsingExistingChart ? (
                <div className={styles.existingChartSummary} aria-label={ui.self.onboardingReviewLabel}>
                  <div className={styles.existingChartTitleRow}>
                    <h3>{form.subjectName}</h3>
                    {form.relationship ? <span>{form.relationship}</span> : null}
                  </div>
                  <p>{isExistingChartLocked ? compactBirthLine(existingChartRequest?.birthData) : compactFormBirthLine(form)}</p>
                </div>
              ) : null}
              <fieldset className={`${styles.optionGroup} ${styles.chartSettingsGroup}`}>
                <legend>{ui.self.chartSettingsLabel}</legend>
                <div className={styles.settingsGrid}>
                  <div className={styles.settingsRow}>
                    <span className={styles.controlLabel}>{ui.self.zodiacModeLabel}</span>
                    <div className={styles.radioOptionRow} role="radiogroup" aria-label={ui.self.zodiacModeLabel}>
                      {(["tropical", "sidereal"] as const).map((zodiacMode) => (
                        <label className={styles.radioOption} key={zodiacMode}>
                          <input
                            checked={form.zodiacMode === zodiacMode}
                            name="zodiacMode"
                            onChange={() => updateField("zodiacMode", zodiacMode)}
                            type="radio"
                          />
                          <span>{ui.self.zodiacModes[zodiacMode]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={styles.settingsRow}>
                    <span className={styles.controlLabel}>{ui.self.houseSystemLabel}</span>
                    {hasHouseCalculation ? (
                      <div className={styles.radioOptionRow} role="radiogroup" aria-label={ui.self.houseSystemLabel}>
                        {(["whole-sign", "placidus"] as const).map((houseSystem) => (
                          <label className={styles.radioOption} key={houseSystem}>
                            <input
                              checked={form.houseSystem === houseSystem}
                              name="houseSystem"
                              onChange={() => updateField("houseSystem", houseSystem)}
                              type="radio"
                            />
                            <span>{ui.self.houseSystems[houseSystem]}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.fieldHint}>{ui.self.houseSystemUnavailable}</span>
                    )}
                  </div>
                </div>
              </fieldset>
              {!isAlly ? (
                <label className={styles.kimiIntro}>
                  <input
                    checked={form.useKimiIntro}
                    onChange={(event) => selectKimiIntro(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    <strong>{ui.self.kimiIntroDeepOffer}</strong>
                  </span>
                </label>
              ) : null}
              <fieldset className={styles.optionGroup} aria-label={ui.self.onboardingReportTypeLabel}>
                {availableReportTypes.map((reportType) => (
                  <label className={styles.option} key={reportType}>
                    <input
                      checked={form.reportType === reportType}
                      name="reportType"
                      onChange={() => selectReportType(reportType)}
                      type="radio"
                    />
                    <span>
                      <strong className={styles.optionTitle}>
                        {reportTypeLabel(reportType)}
                        {" "}
                        <em>{ui.self.reportOptionMeta(reportTypeCost(reportType), reportBasisLabel(reportType))}</em>
                      </strong>
                      {ui.self.onboardingReportTypeDescriptions[reportType]}
                    </span>
                  </label>
                ))}
              </fieldset>
              {form.reportType === "progressed" ? (
                <label>
                  <span>{ui.self.progressedAsOfLabel}</span>
                  <input
                    max={localDateOnly()}
                    min={form.date || undefined}
                    type="date"
                    value={form.progressedAsOfDate}
                    onChange={(event) => updateField("progressedAsOfDate", event.target.value)}
                  />
                </label>
              ) : null}
              {form.reportType === "synastry" ? (
                <label>
                  <span>{ui.self.synastryPartnerLabel}</span>
                  <select
                    value={form.synastryPartnerChartRequestId}
                    onChange={(event) => updateField("synastryPartnerChartRequestId", event.target.value)}
                  >
                    <option value="">{ui.self.synastryPartnerPlaceholder}</option>
                    {synastryChartOptions.map((request) => (
                      <option key={request.id} value={request.id}>
                        {request.subjectName} · {request.birthData.date}
                      </option>
                    ))}
                  </select>
                  {!synastryChartOptions.length ? <small className={styles.fieldHint}>{ui.self.synastryPartnerEmpty}</small> : null}
                </label>
              ) : null}
            </div>
          ) : null}

          {activeStep === "birth_details" ? (
            <>
              <button
                aria-label={ui.self.birthMomentOpen}
                className={styles.birthMomentButton}
                disabled={isExistingChartLocked}
                onClick={() => setIsBirthMomentSheetOpen(true)}
                type="button"
              >
                <span>
                  <strong>{ui.self.birthMomentEdit}</strong>
                  <em>{birthMomentSummary(form)}</em>
                </span>
                <span>{isExistingChartLocked ? ui.self.birthMomentLocked : ui.self.birthMomentEditAction}</span>
              </button>
              <div className={styles.placeSearch}>
                <label>
                  <span>{ui.self.placeSearchLabel}</span>
                  <input
                    value={placeQuery}
                    onChange={(event) => {
                      setHasSelectedPlace(false);
                      setPlaceQuery(event.target.value);
                    }}
                    disabled={isExistingChartLocked}
                    readOnly={isExistingChartLocked}
                    placeholder={ui.self.placeSearchPlaceholder}
                  />
                </label>
                <button className="button secondary" disabled={isSearchingPlaces || isExistingChartLocked} onClick={searchPlaces} type="button">
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
                        <span>{displayTimezone(place.timezone)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {hasSelectedPlace && form.location && form.timezone ? (
                <p className="form-status" aria-live="polite">
                  {ui.self.placeSearchSelected(form.location)} ({displayTimezone(form.timezone)})
                </p>
              ) : null}
              <label>
                <span>{ui.self.chartLocationLabel}</span>
                <input
                  value={form.location}
                  onChange={(event) => {
                    setHasSelectedPlace(false);
                    setForm((current) => ({
                      ...current,
                      location: event.target.value,
                      latitude: undefined,
                      longitude: undefined
                    }));
                    setIsConfirmingReport(false);
                    setMessage("");
                  }}
                  disabled={isExistingChartLocked}
                  readOnly={isExistingChartLocked}
                />
              </label>
              <p className="form-status">{ui.self.birthDetailsOptionalHint}</p>
            </>
          ) : null}

          {message ? <p className="form-status" aria-live="polite">{message}</p> : null}
        </form>
        {isBirthMomentSheetOpen ? (
          <BirthDateTimeSheet
            ctaLabel={isExistingChartLocked ? ui.self.birthMomentSave : ui.self.birthMomentContinue}
            disabled={isExistingChartLocked}
            onClose={() => setIsBirthMomentSheetOpen(false)}
            onSave={applyBirthMoment}
            open={isBirthMomentSheetOpen}
            timezoneOptions={timeZones}
            value={birthMomentValueFor(form)}
          />
        ) : null}
        {isConfirmingReport ? (
          <div className={styles.confirmLayer} data-report-confirm-layer role="presentation" style={confirmLayerStyle}>
            <section
              aria-labelledby="report-confirm-title"
              aria-modal="true"
              className={styles.confirmDialog}
              data-report-confirm-dialog
              role="dialog"
              style={confirmDialogStyle}
            >
              <h3 id="report-confirm-title">{ui.self.reportConfirmTitle}</h3>
              <dl className={styles.review} aria-label={ui.self.onboardingReviewLabel}>
                {reviewRows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {!isAdmin ? (
                <p className={styles.confirmNote} data-report-confirm-note>
                  {canAffordSelectedReport ? ui.self.reportConfirmExplorerNote(balanceAfterReport) : ui.self.reportConfirmInsufficient}
                </p>
              ) : null}
              <div className={styles.confirmActions} data-report-confirm-actions style={confirmActionsStyle}>
                <button className="button secondary" type="button" onClick={() => setIsConfirmingReport(false)}>
                  {ui.self.reportConfirmCancel}
                </button>
                <button
                  className={`button ${styles.confirmPrimaryAction}`}
                  type="button"
                  onClick={submitConfirmedReport}
                  disabled={isSubmitting || !canAffordSelectedReport}
                >
                  {ui.self.reportConfirmOk}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </article>

      {!hideSummaryRail ? (
        <aside className={styles.summaryRail}>
          {isAlly ? (
            <article className={`card ${styles.railCard}`}>
              <h2 className={styles.railTitle}>{ui.allies.wizardAlliesTitle}</h2>
              {allies.length ? (
                <ul className={styles.compactRecordList}>
                  {allies.slice(0, 6).map((ally) => {
                    const chartRequest = chartRequestsBySubjectId.get(ally.id);
                    return (
                      <li key={ally.id}>
                        <div>
                          <strong>{ally.name}</strong>
                          <span>{compactBirthLine(chartRequest?.birthData)}</span>
                        </div>
                        <em>{ally.relationship}</em>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>{ui.allies.wizardAlliesEmpty}</p>
              )}
            </article>
          ) : null}
          {!hideRecentRequestPanels ? (
            <>
              <article className={`card ${styles.railCard}`}>
                <h2 className={styles.railTitle}>{ui.self.chartRequestsTitle}</h2>
                {requests.length ? (
                  <ul className={styles.compactRecordList}>
                    {requests.slice(0, 5).map((request) => (
                      <li key={request.id}>
                        <div>
                          <strong>{request.subjectName}</strong>
                          <span>{compactBirthLine(request.birthData)}</span>
                        </div>
                        <em>{reportStatusLabel(request.status)}</em>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{ui.self.chartRequestsEmpty}</p>
                )}
              </article>
              <article className={`card ${styles.railCard}`}>
                <h2 className={styles.railTitle}>{ui.self.reportRequestsStatusTitle}</h2>
                {reportRequests.length ? (
                  <ul className={styles.compactRecordList}>
                    {reportRequests.slice(0, 5).map((request) => {
                      return (
                        <li key={request.id}>
                          <div>
                            <strong>
                              {request.subjectName}
                              <em className={styles.compactRecordPill}>{reportTypeLabel(request.reportType)}</em>
                            </strong>
                          </div>
                          <span className="compact-list-report-actions">
                            <Link
                              aria-label={ui.charts.viewPortrait}
                              href={`/library?reportId=${encodeURIComponent(request.id)}`}
                              title={ui.charts.viewPortrait}
                            >
                              <BookOpenText aria-hidden="true" size={16} />
                            </Link>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p>{ui.self.reportRequestsEmpty}</p>
                )}
              </article>
            </>
          ) : null}
        </aside>
      ) : null}
    </section>
  );
}
