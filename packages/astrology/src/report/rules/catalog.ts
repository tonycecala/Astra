import { z } from "zod";

import source from "../../../rules/report-policies.json";

const sectionClosingSchema = z.record(z.string(), z.string());

const reportRuleCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  voice: z.object({
    plainspoken: z.array(z.string()).min(1),
    interpretive: z.array(z.string()).min(1),
    sectionClosings: sectionClosingSchema
  }),
  safety: z.array(z.string()).min(1),
  evidence: z.array(z.string()).min(1),
  evaluation: z.object({
    semanticAverageMinimum: z.number(),
    contextSafetyMinimum: z.number(),
    repetitionScoreMinimum: z.number()
  })
});

export type ReportRuleCatalog = z.infer<typeof reportRuleCatalogSchema>;

// The catalog is static, bundled data. Parsing here makes malformed editorial
// rules fail deterministically before a prompt or evaluator can use them.
export const reportRuleCatalog: ReportRuleCatalog = reportRuleCatalogSchema.parse(source);
