import { NextResponse } from "next/server";
import { composerOnboardingCardsWriteSchema } from "@astra/contracts";
import { hasValidInternalApiToken } from "../../../../lib/internal-token";
import { persistComposerOnboardingCardsWrite } from "../../../../lib/composer-private-feed";

export async function POST(request: Request) {
  if (!hasValidInternalApiToken(request)) {
    return NextResponse.json({ error: "INTERNAL_TOKEN_REQUIRED" }, { status: 401 });
  }

  const parsed = composerOnboardingCardsWriteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_COMPOSER_ONBOARDING_CARDS_WRITE",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  try {
    const batch = await persistComposerOnboardingCardsWrite(parsed.data);
    return NextResponse.json({ batch }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "COMPOSER_ONBOARDING_CARDS_WRITE_FAILED" }, { status: 502 });
  }
}
