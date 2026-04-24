import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./auth";
import { canWrite, type Surface } from "./rbac";

export type AuthResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

export async function requireWrite(surface: Surface): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!canWrite(session.role, surface)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, session };
}

export function cityMismatch(
  session: SessionPayload,
  resourceCityId: string | null
): NextResponse | null {
  if (session.cityId && resourceCityId !== session.cityId) {
    return NextResponse.json(
      { error: "Forbidden: out of city scope" },
      { status: 403 }
    );
  }
  return null;
}
