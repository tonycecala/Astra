import { NextResponse } from "next/server";
import { composerStreamArtifactSchema } from "@astra/contracts";
import { db, upsertComposerStreamArtifact } from "@astra/db";
import { hasValidInternalApiToken } from "../../../../lib/internal-token";

export async function POST(request: Request) {
  if (!hasValidInternalApiToken(request)) {
    return NextResponse.json({ error: "INTERNAL_TOKEN_REQUIRED" }, { status: 401 });
  }

  const parsed = composerStreamArtifactSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_COMPOSER_STREAM_ARTIFACT",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const artifact = await upsertComposerStreamArtifact(db, parsed.data);
  return NextResponse.json({ artifact }, { status: 201 });
}
