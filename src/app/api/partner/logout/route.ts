import { NextResponse } from "next/server";
import { clearPartnerCookie } from "@/lib/partnerAuth";

export async function POST() {
  await clearPartnerCookie();
  return NextResponse.json({ ok: true });
}
