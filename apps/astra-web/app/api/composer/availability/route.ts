import { NextResponse } from "next/server";
import { fetchComposerAvailability } from "../../../../lib/composer-selection";

export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    const availability = await fetchComposerAvailability({
      requestType: url.searchParams.get("requestType") ?? url.searchParams.get("type") ?? undefined,
      id: url.searchParams.get("id")?.trim() || undefined,
      cardIds: url.searchParams.getAll("cardId"),
      limit: url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : undefined
    });
    return NextResponse.json({ ok: true, availability });
  } catch (error) {
    console.error("Astra Composer availability fetch failed", error);
    return NextResponse.json({ ok: false, error: "COMPOSER_AVAILABILITY_UNAVAILABLE" }, { status: 503 });
  }
}
