import { NextResponse } from "next/server";
import { composerPrivateFeedWriteSchema } from "@astra/contracts";
import { hasValidInternalApiToken } from "../../../../lib/internal-token";
import { persistComposerPrivateFeedWrite } from "../../../../lib/composer-private-feed";

export async function POST(request: Request) {
  if (!hasValidInternalApiToken(request)) {
    return NextResponse.json({ error: "INTERNAL_TOKEN_REQUIRED" }, { status: 401 });
  }

  const parsed = composerPrivateFeedWriteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_COMPOSER_PRIVATE_FEED_WRITE",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  try {
    const write = await persistComposerPrivateFeedWrite(parsed.data);
    return NextResponse.json({ write }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "COMPOSER_PRIVATE_FEED_WRITE_FAILED" }, { status: 502 });
  }
}
