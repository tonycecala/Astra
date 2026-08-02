import { updateExplorerFocusSchema } from "@astra/contracts";
import { db, updateAuthUserExplorerFocus } from "@astra/db";
import { NextResponse } from "next/server";
import { getAstraAuthContext } from "../../../../lib/auth/profile";

export async function PATCH(request: Request) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const parsed = updateExplorerFocusSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_EXPLORER_FOCUS", issues: parsed.error.issues }, { status: 400 });
  try {
    const focus = await updateAuthUserExplorerFocus(db, { userId: profile.userId, focus: parsed.data });
    return NextResponse.json({ focus });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "FOCUS_SAVE_FAILED" }, { status: 500 });
  }
}
