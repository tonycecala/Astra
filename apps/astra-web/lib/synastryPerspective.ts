import type { ReportChartSourceSnapshot, SynastryPerspective } from "@astra/contracts";

type SynastryPerspectiveInput = {
  primary: ReportChartSourceSnapshot;
  comparison: ReportChartSourceSnapshot;
  perspective: SynastryPerspective;
};

/**
 * The astronomy is reciprocal; this only establishes who the saved report
 * addresses.  Persisting this order in the basis keeps reciprocal readings
 * separate without introducing a second calculation path.
 */
export function synastryBasisForPerspective({
  primary,
  comparison,
  perspective
}: SynastryPerspectiveInput): Pick<SynastryPerspectiveInput, "primary" | "comparison"> {
  return perspective === "comparison"
    ? { primary: comparison, comparison: primary }
    : { primary, comparison };
}
