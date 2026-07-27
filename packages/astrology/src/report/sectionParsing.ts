import type { AstrologyReportRequest, AstrologyReportSection } from "@astra/contracts";

export function sectionFromModelText(input: {
  text: string;
  request: AstrologyReportRequest;
  title: string;
  parseMarkdownSections: (text: string, request: AstrologyReportRequest) => AstrologyReportSection[];
  normalizeVoice: (text: string) => string;
  sectionId: (requestId: string, title: string, index: number) => string;
}): AstrologyReportSection {
  if (/^##\s+/m.test(input.text)) {
    const sections = input.parseMarkdownSections(input.text, input.request);
    if (sections.length !== 1) throw new Error(`Expected one chapter, found ${sections.length}.`);
    return sections[0]!;
  }
  const body = input.normalizeVoice(
    input.text
      .replace(/^#\s+.+$/gm, "")
      .replace(/\*\*Chart Evidence\*\*[\s\S]*$/i, "")
      .replace(/^[-*]\s+/gm, "")
      .trim()
  );
  if (!body) throw new Error("Model draft did not include chapter prose.");
  return {
    id: input.sectionId(input.request.id, input.title, 0),
    title: input.title,
    body,
    emphasis: "supporting"
  };
}
