import { NextResponse } from "next/server";
import { recordAstrologyReportResultSchema } from "@astra/contracts";
import { db, recordAstrologyReportResult } from "@astra/db";
import { hasValidInternalApiToken } from "../../../lib/internal-token";

export async function POST(request: Request) {
  if (!hasValidInternalApiToken(request)) {
    return NextResponse.json({ error: "INTERNAL_TOKEN_REQUIRED" }, { status: 401 });
  }

  const parsed = recordAstrologyReportResultSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_ASTROLOGY_REPORT_RESULT",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  try {
    const result = await recordAstrologyReportResult(db, parsed.data);
    return NextResponse.json({ result }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ASTROLOGY_REPORT_RESULT_NOT_RECORDED" }, { status: 404 });
  }
}
