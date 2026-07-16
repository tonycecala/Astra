import type { AstrologyReportRequest } from "@astra/contracts";
import { ui } from "./i18n";

export function reportDisplayTitle(request: AstrologyReportRequest | null | undefined, generatedTitle?: string | null) {
  const basis = request?.reportBasis;
  if (request?.reportType === "synastry" && basis?.type === "synastry" && basis.partner) {
    return `${basis.primary.subjectName} + ${basis.partner.subjectName} — ${ui.library.reportTypeSynastry}`;
  }

  return generatedTitle?.trim() || ui.library.selectedReportFallbackTitle;
}
