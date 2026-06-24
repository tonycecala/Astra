import { NextResponse } from "next/server";
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

  return NextResponse.json({
    ok: true,
    cache: {
      mode: "edge-ready",
      cacheKey: result.pageState.cacheKey
    },
    result
  });
}
