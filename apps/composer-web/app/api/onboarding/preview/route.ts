import { NextResponse } from "next/server";
import { createComposerOnboardingSeedCards } from "../../../../src";

export async function GET() {
  return NextResponse.json({ ok: true, cards: createComposerOnboardingSeedCards() });
}
