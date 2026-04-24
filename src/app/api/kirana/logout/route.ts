import { NextResponse } from "next/server";
import { clearKiranaCookie } from "@/lib/kiranaAuth";

export async function POST() {
  await clearKiranaCookie();
  return NextResponse.json({ ok: true });
}
