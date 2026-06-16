import { NextResponse } from "next/server";
import { recordChartMakerResultSchema } from "@astra/contracts";
import { db, recordChartMakerResult } from "@astra/db";
import { hasValidInternalApiToken } from "../../../lib/internal-token";

export async function POST(request: Request) {
  if (!hasValidInternalApiToken(request)) {
    return NextResponse.json({ error: "INTERNAL_TOKEN_REQUIRED" }, { status: 401 });
  }

  const parsed = recordChartMakerResultSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_CHART_RESULT",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  try {
    const result = await recordChartMakerResult(db, parsed.data);
    return NextResponse.json({ result }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "CHART_RESULT_NOT_RECORDED" }, { status: 404 });
  }
}
