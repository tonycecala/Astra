import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  chartArrivalRewriteRequestSchema,
  chartArrivalRewriteResponseSchema,
  type ChartArrivalEvidence
} from "@astra/contracts";
import { getInternalToken } from "../../../../lib/config";

const PROMPT_VERSION = "chart-arrival-composer-rules-v1";

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
    return `Your chart opens with a ${sun} Sun, ${moon} Moon, and ${rising} Rising—three distinct signals Astra will keep in view as it explores identity, feeling, and how you meet the world.`;
  }
  if (sun && moon) {
    return `Your ${sun} Sun and ${moon} Moon give Astra a clear first pattern: identity and emotional instinct are both present, without pretending to know the time-sensitive details your chart cannot support.`;
  }
  if (sun) {
    return `Your ${sun} Sun is the first clear pattern Astra can read here, so the journey begins with that verified signal while leaving time-sensitive details open rather than guessing.`;
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
      promptVersion: PROMPT_VERSION
    })
  );
}
