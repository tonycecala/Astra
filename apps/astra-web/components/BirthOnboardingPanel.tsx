"use client";

import Link from "next/link";
import { type CSSProperties, FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenText, Check, Send, Sparkles } from "lucide-react";
import {
  chartCalculationModeForBirthData,
  type Ally,
  AstrologyReportRequest,
  AstrologyReportResult,
  ChartBirthData,
  type ChartArrivalView,
  ChartMakerRequest,
  OrderableAstrologyReportType,
  type SynastryPerspective
} from "@astra/contracts";
import { displayTimezone } from "../lib/display";
import { ui } from "../lib/i18n";
import { REPORT_PRODUCT_ORDER, reportProductFor } from "../lib/reportCatalog";
import { BirthDateTimeSheet } from "./BirthDateTimeSheet";
import { BirthLocationSheet, type BirthLocationValue } from "./BirthLocationSheet";
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
  synastryComparisonRequests?: ChartMakerRequest[];
  initialReportRequests: AstrologyReportRequest[];
  initialReportResults: AstrologyReportResult[];
  subjectType?: "self" | "ally";
  initialAllies?: Ally[];
  initialBirthData?: ChartBirthData;
  initialChartRequestId?: string;
  initialSubjectName?: string;
  initialStep?: Step;
  initialChartArrival?: ChartArrivalView;
  chartArrivalEligible?: boolean;
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
  synastryPartnerChartRequestId: string;
  synastryPerspective: SynastryPerspective;
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

const defaultForm = (
  displayName: string,
  birthData?: ChartBirthData,
  chartRequest?: ChartMakerRequest,
  initialSubjectName?: string
): FormState => ({
  subjectName: chartRequest?.subjectName ?? initialSubjectName ?? displayName,
  relationship: typeof chartSubjectContext(chartRequest)?.relationship === "string" ? chartSubjectContext(chartRequest)?.relationship as string : "",
  note: typeof chartSubjectContext(chartRequest)?.note === "string" ? chartSubjectContext(chartRequest)?.note as string : "",
  reportType: "identity",
  zodiacMode: "tropical",
  houseSystem: "whole-sign",
  synastryPartnerChartRequestId: "",
  synastryPerspective: "primary",
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

type RequestIssue = { path?: string; message?: string };

function requestErrorMessage(code?: string, issues: RequestIssue[] = []) {
  if (code === "INSUFFICIENT_STARS") return ui.self.reportConfirmInsufficient;
  if (code === "INVALID_REPORT_BASIS") return ui.self.reportBasisInvalid;
  if (code === "INVALID_CHART_REQUEST") {
    if (issues.some((issue) => issue.path === "birthData.date")) return ui.self.birthMomentDateRequired;
    if (issues.some((issue) => issue.path === "birthData.time")) return ui.self.birthMomentTimeInvalid;
    if (issues.some((issue) => issue.path === "birthData.timezone")) return ui.self.birthMomentTimezoneRequired;
    return ui.self.chartArrivalInvalidBirthDetails;
  }
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

function reportTypeLabel(reportType: AstrologyReportRequest["reportType"], welcome = false) {
  if (welcome) return ui.library.reportTypeWelcome;
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
  synastryComparisonRequests,
  initialReportRequests,
  initialReportResults = [],
  subjectType = "self",
  initialAllies = [],
  initialBirthData,
  initialChartRequestId,
  initialSubjectName,
  initialStep,
  initialChartArrival,
  chartArrivalEligible = false,
  hideRecentRequestPanels = false,
  hideSummaryRail = false
}: BirthOnboardingPanelProps) {
  const initialChartRequest = initialChartRequestId
    ? initialRequests.find((request) => request.id === initialChartRequestId)
    : undefined;
  const initialForm = defaultForm(displayName, initialBirthData, initialChartRequest, initialSubjectName);
  const requestedInitialStep = initialChartRequest ? initialStep ?? "report" : initialStep ?? "subject";
  const initialActiveStep = (() => {
    if (!chartArrivalEligible || requestedInitialStep !== "report") return requestedInitialStep;
    if (!optional(initialForm.subjectName)) return "subject";
    return isValidDateOnly(initialForm.date) ? "report" : "birth_details";
  })();
  const [form, setForm] = useState<FormState>(initialForm);
  const [allies, setAllies] = useState(initialAllies);
  const [activeStep, setActiveStep] = useState<Step>(initialActiveStep);
  const [selectedExistingChartRequestId, setSelectedExistingChartRequestId] = useState(initialChartRequest?.id ?? "");
  const [requests, setRequests] = useState(initialRequests);
  const [reportRequests, setReportRequests] = useState(initialReportRequests);
  const [, setReportResults] = useState(initialReportResults);
  const [message, setMessage] = useState(
    requestedInitialStep === "report" && initialActiveStep === "birth_details"
      ? ui.self.birthMomentDateRequired
      : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false);
  const [isConfirmingReport, setIsConfirmingReport] = useState(false);
  const [isBirthMomentSheetOpen, setIsBirthMomentSheetOpen] = useState(false);
  const [isBirthLocationSheetOpen, setIsBirthLocationSheetOpen] = useState(false);
  const [chartArrival, setChartArrival] = useState(initialChartArrival);
  const [isCompletingArrival, setIsCompletingArrival] = useState(false);

  const isAlly = subjectType === "ally";
  const isAdmin = role === "admin";
  const synastryChartOptions = useMemo(
    () => (synastryComparisonRequests ?? requests).filter((request) =>
      request.birthData.date &&
      request.id !== selectedExistingChartRequestId &&
      (isAdmin || chartSubjectType(request) !== subjectType)
    ),
    [isAdmin, requests, selectedExistingChartRequestId, subjectType, synastryComparisonRequests]
  );
  const availableReportTypes = REPORT_PRODUCT_ORDER;
  const panelCopy = isAlly ? ui.allies.wizard : ui.self;
  const isWizardComplete = isSubmissionComplete;
  const canSubmit = activeStep === "report" && !isWizardComplete;
  const existingChartRequest = selectedExistingChartRequestId
    ? requests.find((request) => request.id === selectedExistingChartRequestId)
    : undefined;
  const isUsingExistingChart = Boolean(existingChartRequest);
  const isChartArrivalFlow = !isAlly && chartArrivalEligible && chartArrival?.state !== "seen";
  const selectedReportType = form.reportType;
  const selectedReportCost = reportTypeCost(selectedReportType);
  const balanceAfterReport = starBalance - selectedReportCost;
  const canAffordSelectedReport = isAdmin || balanceAfterReport >= 0;
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
  const synastryPrimaryName = existingChartRequest?.subjectName ?? form.subjectName;
  const synastryReaderName = form.synastryPerspective === "comparison"
    ? synastryPartner?.subjectName
    : synastryPrimaryName;
  const synastryComparisonName = form.synastryPerspective === "comparison"
    ? synastryPrimaryName
    : synastryPartner?.subjectName;
  const reviewSubjectName = !isChartArrivalFlow && form.reportType === "synastry"
    ? synastryReaderName
    : form.subjectName;
  const previewBirthData = isExistingChartLocked && existingChartRequest
    ? existingChartRequest.birthData
    : birthDataFor(form);
  const hasHouseCalculation = chartCalculationModeForBirthData(previewBirthData) === "full";
  const reviewRows = [
      [ui.self.onboardingReviewName, reviewSubjectName || ui.self.onboardingReviewMissing],
      ...(isChartArrivalFlow ? [] : [
        [ui.self.onboardingReviewReportType, reportTypeLabel(selectedReportType)],
        [ui.self.reportConfirmBasis, reportBasisLabel(selectedReportType)]
      ]),
      [ui.self.zodiacModeLabel, ui.self.zodiacModes[form.zodiacMode]],
      [ui.self.houseSystemLabel, hasHouseCalculation ? ui.self.houseSystems[form.houseSystem] : ui.self.houseSystemUnavailable],
      ...(!isChartArrivalFlow && form.reportType === "progressed"
        ? ([[ui.self.progressedAsOfLabel, form.progressedAsOfDate]] as const)
        : []),
      ...(!isChartArrivalFlow && form.reportType === "synastry"
        ? ([
            [ui.self.onboardingReviewSynastryReader, synastryReaderName ?? ui.self.onboardingReviewMissing],
            [ui.self.onboardingReviewSynastryPartner, synastryComparisonName ?? ui.self.onboardingReviewMissing]
          ] as const)
        : []),
      ...(isChartArrivalFlow ? [] : [
        [ui.self.reportConfirmCost, ui.stars.reportCost(selectedReportCost)],
        [ui.self.reportConfirmBalance, ui.stars.balance(starBalance)]
      ])
    ];
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

  function applyBirthLocation(nextValue: BirthLocationValue) {
    setForm((current) => ({
      ...current,
      location: nextValue.location,
      timezone: nextValue.timezone || current.timezone,
      latitude: nextValue.latitude,
      longitude: nextValue.longitude
    }));
    setIsBirthLocationSheetOpen(false);
    setIsConfirmingReport(false);
    setMessage("");
  }

  function selectReportType(reportType: ReportType) {
    setForm((current) => ({
      ...current,
      reportType,
      synastryPartnerChartRequestId: reportType === "synastry" ? current.synastryPartnerChartRequestId : "",
      synastryPerspective: reportType === "synastry" ? current.synastryPerspective : "primary"
    }));
    setIsConfirmingReport(false);
    setMessage("");
  }

  function stepError(step: Step) {
    if (step === "subject" && !optional(form.subjectName)) return ui.self.onboardingSubjectRequired;
    if (step === "subject" && isAlly && !optional(form.relationship)) return ui.allies.wizardRelationshipRequired;
    if (!isChartArrivalFlow && step === "report" && form.reportType === "synastry" && !optional(form.synastryPartnerChartRequestId)) {
      return ui.self.onboardingSynastryPartnerRequired;
    }
    if (!isChartArrivalFlow && step === "report" && form.reportType === "progressed") {
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
    if (step === "report" && isChartArrivalFlow) return ui.self.onboardingSteps.arrival;
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

  const subjectNameError = activeStep === "subject" && !optional(form.subjectName) ? ui.self.onboardingSubjectRequired : "";
  const relationshipError = activeStep === "subject" && isAlly && !optional(form.relationship) ? ui.allies.wizardRelationshipRequired : "";
  const activeStepError = stepError(activeStep);

  async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...init.headers
      }
    });
    const text = await response.text();
    let payload = { error: ui.self.chartRequestError } as T & { error?: string; message?: string; issues?: RequestIssue[] };
    if (text) {
      try {
        payload = JSON.parse(text) as T & { error?: string; message?: string; issues?: RequestIssue[] };
      } catch {
        payload = { error: text } as T & { error?: string };
      }
    }
    if (!response.ok) {
      throw new Error(requestErrorMessage(payload.error, payload.issues) || payload.message || payload.error || ui.self.chartRequestError);
    }
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

    if (isChartArrivalFlow) {
      const requiredStep = (["subject", "birth_details"] as const).find((step) => stepError(step));
      if (requiredStep) {
        setActiveStep(requiredStep);
        setMessage(stepError(requiredStep));
        return;
      }
      await submitChartArrival();
      return;
    }

    setIsConfirmingReport(true);
  }

  async function submitChartArrival() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage(ui.self.chartArrivalReading);

    try {
      const chartSettings = {
        zodiacMode: form.zodiacMode,
        houseSystem: form.houseSystem
      };
      const canReuseExistingChart = Boolean(existingChartRequest && birthDataMatchesForm(existingChartRequest.birthData, form));
      const chartRequest = canReuseExistingChart && existingChartRequest
        ? existingChartRequest
        : (await requestJson<{ request: ChartMakerRequest }>("/api/chart-requests", {
            method: "POST",
            body: JSON.stringify({
              subjectName: form.subjectName.trim(),
              birthData: birthDataFor(form),
              source: "self",
              context: {
                subject: {
                  subjectType: "self",
                  displayName: form.subjectName.trim()
                },
                chartSettings
              }
            })
          })).request;
      const arrival = await requestJson<ChartArrivalView>("/api/chart-arrivals", {
        method: "POST",
        body: JSON.stringify({ chartRequestId: chartRequest.id })
      });

      if (!canReuseExistingChart) {
        setRequests((current) => [chartRequest, ...current.filter((request) => request.id !== chartRequest.id)]);
      }
      setSelectedExistingChartRequestId(chartRequest.id);
      setChartArrival(arrival);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : ui.self.chartArrivalError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeArrival() {
    if (!chartArrival || isCompletingArrival) return;
    setIsCompletingArrival(true);
    setMessage("");
    try {
      await requestJson<ChartArrivalView>(
        `/api/chart-arrivals/${encodeURIComponent(chartArrival.chartRequestId)}/complete`,
        { method: "POST" }
      );
      window.location.assign("/self");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : ui.self.chartArrivalCompleteError);
      setIsCompletingArrival(false);
    }
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
      const basisType = reportProductFor(selectedReportType).basis;
      const reportBasis = basisType === "progressed"
        ? { type: basisType, chartSettings, asOfDate: form.progressedAsOfDate }
        : basisType === "synastry"
          ? {
              type: basisType,
              chartSettings,
              partnerChartRequestId: form.synastryPartnerChartRequestId,
              perspective: form.synastryPerspective
            }
          : { type: basisType, chartSettings };
      const reportPayload = await requestJson<{ request: AstrologyReportRequest }>("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          chartRequestId: chartRequest.id,
          reportType: selectedReportType,
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
    setIsConfirmingReport(false);
    setIsBirthMomentSheetOpen(false);
    setIsBirthLocationSheetOpen(false);
    setSelectedExistingChartRequestId("");
    setForm(defaultForm(displayName, initialBirthData, undefined, initialSubjectName));
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

  if (chartArrival?.state === "available") {
    return (
      <section className={styles.panel} aria-label={ui.self.chartArrivalPanelLabel}>
        <article className={`card ${styles.arrivalCard}`}>
          <div className={styles.arrivalMark} aria-hidden="true"><Sparkles size={22} /></div>
          <h2>{ui.self.chartArrivalTitle}</h2>
          <p className={styles.arrivalRecognition}>{chartArrival.recognition}</p>
          <div className={styles.arrivalEvidence} aria-label={ui.self.chartArrivalEvidenceLabel}>
            {chartArrival.evidence.map((fact) => (
              <div className={styles.arrivalFact} key={fact.key}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
          <div className={styles.arrivalGlimpse}>
            <h3>{ui.self.chartArrivalGlimpseLabel}</h3>
            <p>{chartArrival.glimpse}</p>
          </div>
          <p className={styles.arrivalOrientation}>{ui.self.chartArrivalOrientation}</p>
          <button className="button" disabled={isCompletingArrival} onClick={completeArrival} type="button">
            <Sparkles aria-hidden="true" size={18} />
            {isCompletingArrival ? ui.self.chartArrivalCompleting : ui.self.chartArrivalEnter}
          </button>
          {message ? <p className={styles.message} role="status">{message}</p> : null}
        </article>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-label={panelCopy.chartRequestPanelLabel}>
      <article className="card">
        <h2>{isAlly ? ui.allies.wizard.chartRequestExistingTitle : isChartArrivalFlow ? ui.self.chartArrivalPanelTitle : panelCopy.chartRequestTitle}</h2>
        {!isAlly && !isExistingChartOrderMode ? <p>{isChartArrivalFlow ? ui.self.chartArrivalPanelIntro : panelCopy.chartRequestIntro}</p> : null}

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
              <button className="button" type="submit" disabled={isSubmitting || Boolean(activeStepError)}>
                {isSubmitting ? <Send aria-hidden="true" size={18} /> : null}
                {isSubmitting
                  ? isChartArrivalFlow ? ui.self.chartArrivalReading : ui.self.chartRequestWorking
                  : isChartArrivalFlow ? ui.self.chartArrivalReveal : ui.self.chartRequestSubmit}
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
                disabled={Boolean(activeStepError)}
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
                  aria-invalid={Boolean(subjectNameError)}
                  disabled={isExistingChartLocked}
                  readOnly={isExistingChartLocked}
                  value={form.subjectName}
                  onChange={(event) => updateField("subjectName", event.target.value)}
                  required
                />
                {subjectNameError ? <small className={styles.subjectFieldError}>{subjectNameError}</small> : null}
              </label>
              {isAlly ? (
                <>
                  <label>
                    <span>{ui.allies.wizardRelationshipLabel}</span>
                    <input
                      aria-invalid={Boolean(relationshipError)}
                      disabled={isExistingChartLocked}
                      readOnly={isExistingChartLocked}
                      value={form.relationship}
                      onChange={(event) => updateField("relationship", event.target.value)}
                      required={!isExistingChartLocked}
                    />
                    {relationshipError ? <small className={styles.subjectFieldError}>{relationshipError}</small> : null}
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
              {!isChartArrivalFlow ? <fieldset className={styles.optionGroup} aria-label={ui.self.onboardingReportTypeLabel}>
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
              </fieldset> : null}
              {!isChartArrivalFlow && form.reportType === "progressed" ? (
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
              {!isChartArrivalFlow && form.reportType === "synastry" ? (
                <>
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
                  {synastryPartner ? (
                    <fieldset className={styles.optionGroup}>
                      <legend>{ui.self.synastryPerspectiveLabel}</legend>
                      <div className={styles.radioOptionRow} role="radiogroup" aria-label={ui.self.synastryPerspectiveLabel}>
                        <label className={styles.radioOption}>
                          <input
                            checked={form.synastryPerspective === "primary"}
                            name="synastryPerspective"
                            onChange={() => updateField("synastryPerspective", "primary")}
                            type="radio"
                          />
                          <span>{ui.self.synastryPerspectivePrimary(synastryPrimaryName)}</span>
                        </label>
                        <label className={styles.radioOption}>
                          <input
                            checked={form.synastryPerspective === "comparison"}
                            name="synastryPerspective"
                            onChange={() => updateField("synastryPerspective", "comparison")}
                            type="radio"
                          />
                          <span>{ui.self.synastryPerspectiveComparison(synastryPartner.subjectName)}</span>
                        </label>
                      </div>
                      <small className={styles.fieldHint}>{ui.self.synastryPerspectiveHint}</small>
                    </fieldset>
                  ) : null}
                </>
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
              <button
                aria-label={ui.self.birthLocationOpen}
                className={styles.birthMomentButton}
                disabled={isExistingChartLocked}
                onClick={() => setIsBirthLocationSheetOpen(true)}
                type="button"
              >
                <span>
                  <strong>{ui.self.birthLocationEdit}</strong>
                  <em>{form.location || ui.self.birthLocationNotSelected}</em>
                </span>
                <span>{isExistingChartLocked ? ui.self.birthMomentLocked : ui.self.birthMomentEditAction}</span>
              </button>
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
        {isBirthLocationSheetOpen ? (
          <BirthLocationSheet
            ctaLabel={isExistingChartLocked ? ui.self.birthMomentSave : ui.self.birthMomentContinue}
            disabled={isExistingChartLocked}
            onClose={() => setIsBirthLocationSheetOpen(false)}
            onSave={applyBirthLocation}
            open={isBirthLocationSheetOpen}
            value={{
              location: form.location,
              timezone: form.timezone,
              latitude: form.latitude,
              longitude: form.longitude
            }}
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
                              <em className={styles.compactRecordPill}>{reportTypeLabel(request.reportType, request.context?.modelPilot === "gemini-intro-identity")}</em>
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
