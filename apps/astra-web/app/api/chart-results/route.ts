import { NextResponse } from "next/server";
import { recordChartMakerResultSchema } from "@astra/contracts";
import { db, recordChartMakerResult } from "@astra/db";

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

function internalToken() {
  const token = clean(process.env.ASTRA_INTERNAL_API_TOKEN);
  if (token) return token;
  if (!process.env.VERCEL_ENV) return "astra-local-internal-token";
  throw new Error("ASTRA_INTERNAL_API_TOKEN is required outside local development.");
}

export async function POST(request: Request) {
  if (request.headers.get("x-astra-internal-token") !== internalToken()) {
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
