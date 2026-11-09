import { db } from "@astra/db";
import { NextResponse } from "next/server";
import { authorizedNotificationJob, deliverOwnerNotifications, ownerNotificationConfig } from "../../../../lib/owner-notifications";
import { sendEmail } from "../../../../lib/email/send-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!authorizedNotificationJob(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const config = ownerNotificationConfig();
  if (!config) return NextResponse.json({ skipped: true });
  const result = await deliverOwnerNotifications(db, config.to, sendEmail);
  return NextResponse.json(result, { status: result.failed ? 503 : 200 });
}
