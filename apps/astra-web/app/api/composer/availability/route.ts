import { composerAvailabilityResponseSchema } from "@astra/contracts";
import { NextResponse } from "next/server";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function getComposerBaseUrl() {
  return clean(process.env.COMPOSER_APP_BASE_URL) || clean(process.env.COMPOSER_APP_SMOKE_BASE_URL) || "http://localhost:3012";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const composerUrl = new URL("/api/library/availability", getComposerBaseUrl());
  composerUrl.search = url.searchParams.toString();

  try {
    const response = await fetch(composerUrl, { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as { availability?: unknown; error?: string };

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: body.error ?? "COMPOSER_AVAILABILITY_UNAVAILABLE" }, { status: response.status });
    }

    const parsed = composerAvailabilityResponseSchema.safeParse(body.availability);
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
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, availability: parsed.data });
  } catch (error) {
    console.error("Astra Composer availability fetch failed", error);
    return NextResponse.json({ ok: false, error: "COMPOSER_AVAILABILITY_UNAVAILABLE" }, { status: 503 });
  }
}
