import { NextResponse } from "next/server";
import { createAllySchema } from "@astra/contracts";
import { createAlly, db, listUserAllies } from "@astra/db";
import { getAstraAuthContext } from "../../../lib/auth/profile";

function unauthorized() {
  return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
}

export async function GET() {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const allies = await listUserAllies(db, profile.userId);
  return NextResponse.json({ allies });
}

export async function POST(request: Request) {
  const { profile } = await getAstraAuthContext();
  if (!profile) return unauthorized();

  const parsed = createAllySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_ALLY",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const ally = await createAlly(db, {
    ...parsed.data,
    userId: profile.userId
  });

  return NextResponse.json({ ally }, { status: 201 });
}
