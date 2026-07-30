import { NextResponse } from "next/server";
import { getAstraAuthContext } from "../../../../../lib/auth/profile";
import { completeChartArrival } from "../../../../../lib/chart-arrival";

type RouteContext = { params: Promise<{ chartRequestId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const { chartRequestId } = await context.params;
  try {
    const arrival = await completeChartArrival(profile.userId, chartRequestId);
    return NextResponse.json(arrival);
  } catch (error) {
    const code = error instanceof Error ? error.message : "CHART_ARRIVAL_NOT_COMPLETED";
    return NextResponse.json({ error: code }, { status: code === "CHART_ARRIVAL_NOT_FOUND" ? 404 : 502 });
  }
}
