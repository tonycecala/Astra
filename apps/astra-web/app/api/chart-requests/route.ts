import { NextResponse } from "next/server";
import { createChartMakerRequestSchema } from "@astra/contracts";
import { createChartMakerRequest, db, listUserChartMakerRequests } from "@astra/db";
import { getAstraAuthContext } from "../../../lib/auth/profile";

function unauthorized() {
  return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
}

export async function GET() {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const requests = await listUserChartMakerRequests(db, profile.userId);
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const parsed = createChartMakerRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_CHART_REQUEST",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const chartRequest = await createChartMakerRequest(db, {
    ...parsed.data,
    userId: profile.userId
  });

  return NextResponse.json({ request: chartRequest }, { status: 201 });
}
