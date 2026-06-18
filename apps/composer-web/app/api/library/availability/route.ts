import { composerAvailabilityResponseSchema, type ComposerAvailabilityRequest } from "@astra/contracts";
import { db, upsertComposerLibraryAvailability } from "@astra/db";
import { NextResponse } from "next/server";
import { buildComposerAvailability } from "../../../../lib/cardLibrary";

const requestTypes = new Set<ComposerAvailabilityRequest["requestType"]>(["course", "series", "pool", "ordered_list", "onboarding"]);

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

function requestFromParams(params: URLSearchParams): Partial<ComposerAvailabilityRequest> {
  const rawRequestType = params.get("requestType") ?? params.get("type") ?? "course";
  const requestType = requestTypes.has(rawRequestType as ComposerAvailabilityRequest["requestType"]) ? (rawRequestType as ComposerAvailabilityRequest["requestType"]) : "course";
  const cardIds = values(params, "cardId");
  return {
    requestType,
    id: params.get("id")?.trim() || undefined,
    cardIds,
    limit: intValue(params, "limit")
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const availability = buildComposerAvailability(requestFromParams(url.searchParams));
  let persisted = false;
  let responseAvailability = availability;

  try {
    const collection = await upsertComposerLibraryAvailability(db, availability, {
      source: "composer-web-fixture",
      metadata: {
        route: "/api/library/availability"
      }
    });
    responseAvailability = {
      request: availability.request,
      collection
    };
    persisted = true;
  } catch (error) {
    console.error("Composer library availability persist failed", error);
  }

  const parsed = composerAvailabilityResponseSchema.safeParse(responseAvailability);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_COMPOSER_AVAILABILITY",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    cache: {
      persisted,
      collectionId: parsed.data.collection.id
    },
    availability: parsed.data
  });
}
