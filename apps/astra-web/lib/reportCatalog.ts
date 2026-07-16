import type { OrderableAstrologyReportType, ReportBasisType } from "@astra/contracts";

export type ReportProductDefinition = {
  basis: ReportBasisType;
  costStars: number;
  requiresKnownBirthTime: boolean;
  requiresPartner: boolean;
};

export const REPORT_PRODUCT_ORDER: readonly OrderableAstrologyReportType[] = [
  "identity",
  "core",
  "deep",
  "progressed",
  "synastry"
];

export const REPORT_PRODUCTS: Record<OrderableAstrologyReportType, ReportProductDefinition> = {
  identity: { basis: "natal", costStars: 1, requiresKnownBirthTime: false, requiresPartner: false },
  core: { basis: "natal", costStars: 5, requiresKnownBirthTime: false, requiresPartner: false },
  deep: { basis: "natal", costStars: 10, requiresKnownBirthTime: false, requiresPartner: false },
  progressed: { basis: "progressed", costStars: 5, requiresKnownBirthTime: true, requiresPartner: false },
  synastry: { basis: "synastry", costStars: 10, requiresKnownBirthTime: false, requiresPartner: true }
};

export function isOrderableReportType(value: string): value is OrderableAstrologyReportType {
  return REPORT_PRODUCT_ORDER.includes(value as OrderableAstrologyReportType);
}

export function reportProductFor(reportType: OrderableAstrologyReportType) {
  return REPORT_PRODUCTS[reportType];
}
