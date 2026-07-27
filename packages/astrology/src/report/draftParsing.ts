import type { AstrologyReportRequest, AstrologyReportSection } from "@astra/contracts";

type DraftShape = {
  summary?: string;
  sections?: AstrologyReportSection[];
  publicSignal?: { provenanceSummary: string; [key: string]: unknown };
};

export function parseModelDraft<TChart, TDraft extends DraftShape>(
  text: string,
  request: AstrologyReportRequest,
  chartSignature: TChart,
  dependencies: {
    deterministicBaseline: (input: { request: AstrologyReportRequest; chartSignature: TChart }) => TDraft;
    canonicalIdentity: (request: AstrologyReportRequest) => string;
    writerHeadings: (request: AstrologyReportRequest) => string[];
    markdownSections: (text: string, request: AstrologyReportRequest) => AstrologyReportSection[];
    assembleSections: (request: AstrologyReportRequest, sections: AstrologyReportSection[]) => AstrologyReportSection[];
    summaryFromMarkdown: (text: string, fallback: string) => string;
    debugWriter: string;
  }
): TDraft {
  const baseline = dependencies.deterministicBaseline({ request, chartSignature });
  if (!baseline.publicSignal) throw new Error("Deterministic baseline did not include a public signal.");
  const canonicalIdentity = dependencies.canonicalIdentity(request);
  const writerHeadings = new Set<string>(dependencies.writerHeadings(request));
  const generatedSections = dependencies.markdownSections(text, request).filter((section) => writerHeadings.has(section.title));
  const sections = dependencies.assembleSections(request, generatedSections);
  return {
    summary: dependencies.summaryFromMarkdown(canonicalIdentity || text, baseline.summary ?? `${request.subjectName}'s report is grounded in the computed chart signature.`),
    sections,
    publicSignal: { ...baseline.publicSignal, provenanceSummary: `${baseline.publicSignal.provenanceSummary}, ${dependencies.debugWriter}` }
  } as TDraft;
}
