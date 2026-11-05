import type { OrderableAstrologyReportType, ReportBasisType } from "@astra/contracts";

export type ReportProductDefinition = {
  basis: ReportBasisType;
  costStars: number;
};

// Only these products can be purchased. Older request types remain valid for saved reports.
export const REPORT_PRODUCT_ORDER: readonly OrderableAstrologyReportType[] = [
  "personal",
  "synastry",
  "progressed"
];

export const REPORT_PRODUCTS: Record<OrderableAstrologyReportType, ReportProductDefinition> = {
  personal: { basis: "natal", costStars: 10 },
  identity: { basis: "natal", costStars: 1 },
  core: { basis: "natal", costStars: 5 },
  deep: { basis: "natal", costStars: 10 },
  progressed: { basis: "progressed", costStars: 5 },
  synastry: { basis: "synastry", costStars: 10 }
};

export function isOrderableReportType(value: string): value is OrderableAstrologyReportType {
  return REPORT_PRODUCT_ORDER.includes(value as OrderableAstrologyReportType);
}

export function reportProductFor(reportType: OrderableAstrologyReportType) {
  return REPORT_PRODUCTS[reportType];
}
