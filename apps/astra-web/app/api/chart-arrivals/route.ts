import { NextResponse } from "next/server";
import { createChartArrivalSchema } from "@astra/contracts";
import { getAstraAuthContext } from "../../../lib/auth/profile";
import { ensureChartArrival } from "../../../lib/chart-arrival";

export async function POST(request: Request) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const parsed = createChartArrivalSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_CHART_ARRIVAL_REQUEST" }, { status: 400 });

  try {
    const arrival = await ensureChartArrival(profile.userId, parsed.data.chartRequestId);
    return NextResponse.json(arrival, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CHART_ARRIVAL_FAILED";
    const status = code === "CHART_ARRIVAL_CHART_NOT_FOUND" ? 404 : code === "CHART_ARRIVAL_ALREADY_COMPLETED" ? 409 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}
