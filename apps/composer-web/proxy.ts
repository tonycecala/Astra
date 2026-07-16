import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getComposerAccessState, getInternalToken } from "./lib/config";

const publicPaths = new Set(["/api/library/availability", "/api/status"]);

function tokensMatch(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export function proxy(request: NextRequest) {
  if (!getComposerAccessState().isLocked || publicPaths.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const expectedToken = getInternalToken();
  const providedToken = request.headers.get("x-astra-internal-token")?.trim() ?? "";
  if (expectedToken && providedToken && tokensMatch(providedToken, expectedToken)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "COMPOSER_AUTH_REQUIRED" }, { status: 401 });
  }

  return new NextResponse("Not found", { status: 404 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
