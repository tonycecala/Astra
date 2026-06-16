import { NextResponse } from "next/server";
import { createAstrologyReportRequestSchema } from "@astra/contracts";
import { createAstrologyReportRequest, db, listUserAstrologyReportRequests } from "@astra/db";
import { getAstraAuthContext } from "../../../lib/auth/profile";

function unauthorized() {
  return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
}

export async function GET() {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const requests = await listUserAstrologyReportRequests(db, profile.userId);
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const parsed = createAstrologyReportRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_ASTROLOGY_REPORT_REQUEST",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const reportRequest = await createAstrologyReportRequest(db, {
    ...parsed.data,
    userId: profile.userId
  });

  return NextResponse.json({ request: reportRequest }, { status: 201 });
}
