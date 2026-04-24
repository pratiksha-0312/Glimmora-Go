import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRead } from "@/lib/apiAuth";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const auth = await requireRead("audit");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? 30)));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const events = await prisma.auditEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "createdAt",
    "adminEmail",
    "adminRole",
    "action",
    "entityType",
    "entityId",
    "summary",
    "ip",
  ];
  const lines = [header.join(",")];
  for (const e of events) {
    lines.push(
      [
        e.createdAt.toISOString(),
        e.adminEmail,
        e.adminRole,
        e.action,
        e.entityType,
        e.entityId,
        e.summary ?? "",
        e.ip ?? "",
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=audit-${days}d-${today}.csv`,
    },
  });
}
