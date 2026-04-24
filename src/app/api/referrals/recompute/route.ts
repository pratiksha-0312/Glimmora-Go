import { NextResponse } from "next/server";
import { requireWrite } from "@/lib/apiAuth";
import { recomputeReferralRewards } from "@/lib/referrals";

export async function POST() {
  const auth = await requireWrite("referrals");
  if (!auth.ok) return auth.response;

  const granted = await recomputeReferralRewards();
  return NextResponse.json({ ok: true, granted });
}
