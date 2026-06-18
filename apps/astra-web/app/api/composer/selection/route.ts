import { composerSelectionRequestSchema } from "@astra/contracts";
import { NextResponse } from "next/server";
import { selectComposerCardsForUser } from "../../../../lib/composer-selection";

function values(params: URLSearchParams, key: string) {
  return params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function intValue(params: URLSearchParams, key: string) {
  const value = Number.parseInt(params.get(key) ?? "", 10);
  return Number.isFinite(value) ? value : undefined;
}

function eligibilityFromParams(params: URLSearchParams) {
  const eligibility: Record<string, unknown> = {};
  for (const value of values(params, "topic")) eligibility[`topic:${value}`] = true;
  for (const value of values(params, "tag")) eligibility[`tag:${value}`] = true;
  const rawEligibility = params.get("eligibility");
  if (rawEligibility) {
    try {
      const parsed = JSON.parse(rawEligibility) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return { ...eligibility, ...(parsed as Record<string, unknown>) };
      }
    } catch {
      eligibility.raw = rawEligibility;
    }
  }
  return eligibility;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userKey = url.searchParams.get("userKey")?.trim() ?? "";
  if (!userKey) {
    return NextResponse.json({ ok: false, error: "USER_KEY_REQUIRED" }, { status: 400 });
  }

  const parsed = composerSelectionRequestSchema.safeParse({
    requestType: url.searchParams.get("requestType") ?? url.searchParams.get("type") ?? "course",
    id: url.searchParams.get("id")?.trim() || "astrology_101",
    cardIds: values(url.searchParams, "cardId"),
    limit: intValue(url.searchParams, "limit") ?? 100,
    userKey,
    selectionDate: url.searchParams.get("selectionDate")?.trim() || undefined,
    count: intValue(url.searchParams, "count") ?? 5,
    eligibility: eligibilityFromParams(url.searchParams)
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_COMPOSER_SELECTION_REQUEST",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  try {
    const selection = await selectComposerCardsForUser(parsed.data);
    return NextResponse.json({ ok: true, selection });
  } catch (error) {
    console.error("Astra Composer selection failed", error);
    return NextResponse.json({ ok: false, error: "COMPOSER_SELECTION_UNAVAILABLE" }, { status: 503 });
  }
}
