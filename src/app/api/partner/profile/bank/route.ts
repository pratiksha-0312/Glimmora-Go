import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getPartnerSession } from "@/lib/partnerAuth";

const schema = z.object({
  bankAccountName: z.string().min(1).max(100),
  bankAccountNumber: z.string().regex(/^\d{6,20}$/, "Account number must be 6-20 digits"),
  bankIfsc: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code")
    .transform((s) => s.toUpperCase()),
  bankName: z.string().min(1).max(100),
});

export async function PATCH(req: Request) {
  const session = await getPartnerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  await prisma.partner.update({
    where: { id: session.partnerId },
    data: {
      bankAccountName: d.bankAccountName,
      bankAccountNumber: d.bankAccountNumber,
      bankIfsc: d.bankIfsc,
      bankName: d.bankName,
    },
  });

  return NextResponse.json({ ok: true });
}
