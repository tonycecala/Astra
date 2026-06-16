import { NextResponse } from "next/server";
import { BirthPlaceSearchUnavailableError, searchBirthPlaces } from "@astra/astrology";
import { birthPlaceSearchQuerySchema } from "@astra/contracts";
import { getAstraAuthContext } from "../../../../lib/auth/profile";

function unauthorized() {
  return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
}

export async function GET(request: Request) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const url = new URL(request.url);
  const parsed = birthPlaceSearchQuerySchema.safeParse({
    query: url.searchParams.get("q") ?? "",
    limit: url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : undefined
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_PLACE_SEARCH",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  try {
    const result = await searchBirthPlaces(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BirthPlaceSearchUnavailableError) {
      return NextResponse.json({ error: "PLACE_SEARCH_PROVIDER_UNAVAILABLE", message: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: "PLACE_SEARCH_FAILED" }, { status: 502 });
  }
}
