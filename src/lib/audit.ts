import { headers } from "next/headers";
import { prisma } from "./db";
import type { SessionPayload } from "./auth";

type LogInput = {
  session: SessionPayload;
  action: string; // e.g. "driver.approve", "coupon.create"
  entityType: string;
  entityId: string;
  summary?: string;
  changes?: Record<string, unknown>;
};

export async function logAudit(input: LogInput): Promise<void> {
  try {
    const hdrs = await headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      hdrs.get("x-real-ip") ??
      null;
    const userAgent = hdrs.get("user-agent") ?? null;

    await prisma.auditEvent.create({
      data: {
        adminId: input.session.adminId,
        adminEmail: input.session.email,
        adminName: input.session.name,
        adminRole: input.session.role,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary,
        changes: input.changes
          ? (input.changes as unknown as object)
          : undefined,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    // Audit logging must never break the actual operation.
    console.error("audit log failed", err);
  }
}
