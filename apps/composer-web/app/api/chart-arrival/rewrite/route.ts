import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  chartArrivalRewriteRequestSchema,
  chartArrivalRewriteResponseSchema,
  type ChartArrivalEvidence
} from "@astra/contracts";
import { getInternalToken } from "../../../../lib/config";

const PROMPT_VERSION = "focus-first-arrival-composer-v1";

function tokensMatch(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

function evidenceValue(evidence: ChartArrivalEvidence[], key: ChartArrivalEvidence["key"]) {
  return evidence.find((item) => item.key === key)?.value;
}

function rewriteFirstGlimpse(evidence: ChartArrivalEvidence[], fallback: string) {
  const sun = evidenceValue(evidence, "sun");
  const moon = evidenceValue(evidence, "moon");
  const rising = evidenceValue(evidence, "rising");

  if (sun && moon && rising) {
    return fallback;
  }
  if (sun && moon) {
    return fallback;
  }
  if (sun) {
    return fallback;
  }
  return fallback;
}

export async function POST(request: Request) {
  const expectedToken = getInternalToken();
  const providedToken = request.headers.get("x-astra-internal-token")?.trim() ?? "";
  if (!expectedToken || !providedToken || !tokensMatch(providedToken, expectedToken)) {
    return NextResponse.json({ error: "COMPOSER_AUTH_REQUIRED" }, { status: 401 });
  }

  const parsed = chartArrivalRewriteRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_CHART_ARRIVAL_REWRITE" }, { status: 400 });
  }

  return NextResponse.json(
    chartArrivalRewriteResponseSchema.parse({
      glimpse: rewriteFirstGlimpse(parsed.data.evidence, parsed.data.deterministicGlimpse),
      journeyBody: parsed.data.deterministicJourneyBody,
      promptVersion: PROMPT_VERSION
    })
  );
}
