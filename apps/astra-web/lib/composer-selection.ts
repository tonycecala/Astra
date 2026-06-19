import "server-only";

import {
  composerAvailabilityResponseSchema,
  composerSelectionRequestSchema,
  composerSelectionResponseSchema,
  type ComposerAvailabilityResponse,
  type ComposerSelectionRequest,
  type ComposerSelectionResponse
} from "@astra/contracts";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function getComposerBaseUrl() {
  return clean(process.env.COMPOSER_APP_BASE_URL) || clean(process.env.COMPOSER_APP_SMOKE_BASE_URL) || "http://localhost:3012";
}

function todayDateOnly() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function orderedSelection(availability: ComposerAvailabilityResponse, request: ComposerSelectionRequest) {
  const selectionDate = request.selectionDate ?? todayDateOnly();
  return [...availability.collection.cards]
    .map((card, index) => ({
      card,
      rank: stableHash(`${request.userKey}:${selectionDate}:${availability.collection.id}:${card.id}:${index}`)
    }))
    .sort((a, b) => a.rank - b.rank || (a.card.order ?? 0) - (b.card.order ?? 0) || a.card.id.localeCompare(b.card.id))
    .slice(0, request.count)
    .map((item) => item.card);
}

export async function fetchComposerAvailabilityForSelection(request: ComposerSelectionRequest): Promise<ComposerAvailabilityResponse> {
  const composerUrl = new URL("/api/library/availability", getComposerBaseUrl());
  composerUrl.searchParams.set("requestType", request.requestType);
  if (request.id) composerUrl.searchParams.set("id", request.id);
  composerUrl.searchParams.set("limit", String(request.limit));
  for (const cardId of request.cardIds) composerUrl.searchParams.append("cardId", cardId);

  const response = await fetch(composerUrl, { cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as { availability?: unknown; error?: string };
  if (!response.ok) throw new Error(body.error ?? "COMPOSER_AVAILABILITY_UNAVAILABLE");

  return composerAvailabilityResponseSchema.parse(body.availability);
}

export async function selectComposerCardsForUser(input: Partial<ComposerSelectionRequest> & { userKey: string }): Promise<ComposerSelectionResponse> {
  const request = composerSelectionRequestSchema.parse({
    requestType: input.requestType ?? "course",
    id: input.id ?? "astrology_101",
    cardIds: input.cardIds ?? [],
    limit: input.limit ?? 100,
    userKey: input.userKey,
    selectionDate: input.selectionDate ?? todayDateOnly(),
    count: input.count ?? 5,
    eligibility: input.eligibility ?? {}
  });
  const availability = await fetchComposerAvailabilityForSelection(request);
  const selectedCards = orderedSelection(availability, request);
  return composerSelectionResponseSchema.parse({
    id: `composer_selection:${request.userKey}:${request.selectionDate}:${availability.collection.id}:${request.count}`,
    request,
    availability,
    selectedCards,
    generatedAt: new Date().toISOString(),
    reasonCode: "deterministic_daily_selection_v1",
    selectionMode: "deterministic"
  });
}
