import { NextResponse } from "next/server";
import { db, upsertComposerCardQueryCache } from "@astra/db";
import { type ComposerCardScope, queryComposerCards } from "../../../../lib/cardLibrary";

const scopes = new Set<ComposerCardScope>(["all", "drafts", "course"]);

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawScope = url.searchParams.get("scope") ?? "all";
  const scope = scopes.has(rawScope as ComposerCardScope) ? (rawScope as ComposerCardScope) : "all";
  const result = queryComposerCards({
    scope,
    query: url.searchParams.get("query") ?? "",
    feeds: values(url.searchParams, "feed"),
    kinds: values(url.searchParams, "kind"),
    lanes: values(url.searchParams, "lane"),
    statuses: values(url.searchParams, "status"),
    tags: values(url.searchParams, "tag"),
    page: intValue(url.searchParams, "page"),
    pageSize: intValue(url.searchParams, "pageSize")
  });
  let cachePersisted = false;

  try {
    await upsertComposerCardQueryCache(db, {
      cacheKey: result.pageState.cacheKey,
      scope,
      fingerprint: result.pageState.fingerprint,
      page: result.page,
      pageSize: result.pageSize,
      totalCards: result.totalCards,
      windowStart: result.pageState.windowStart,
      windowEnd: result.pageState.windowEnd,
      cardIds: result.cards.map((card) => card.id),
      facets: result.facets
    });
    cachePersisted = true;
  } catch (error) {
    console.error("Composer card query cache persist failed", error);
  }

  return NextResponse.json({
    ok: true,
    cache: {
      persisted: cachePersisted,
      cacheKey: result.pageState.cacheKey
    },
    result
  });
}
