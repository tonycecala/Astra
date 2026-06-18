import { NextResponse } from "next/server";
import { getComposerRuntimeStatus } from "../../../lib/config";

export async function GET() {
  return NextResponse.json(getComposerRuntimeStatus());
}
