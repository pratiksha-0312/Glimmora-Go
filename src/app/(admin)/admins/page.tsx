import { prisma } from "@/lib/db";
import { requireAccess } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminManagementClient, type AdminRow } from "./AdminManagementClient";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    return { admins, dbError: false };
  } catch {
    return { admins: [], dbError: true };
  }
}

export default async function AdminsPage() {
  const session = await requireAccess("admins");
  const { admins, dbError } = await getData();

  const rows: AdminRow[] = admins.map((a) => ({
    id: a.id,
    email: a.email,
    username: a.username,
    name: a.name,
    firstName: a.firstName,
    lastName: a.lastName,
    role: a.role,
    active: a.active,
    lastLoginAt: a.lastLoginAt ? a.lastLoginAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  }));

  const nextUserId = `ADM${String(admins.length + 1).padStart(4, "0")}`;

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Configuration" },
          { label: "Admin Users" },
        ]}
        title="Admins"
        description="Manage admin users — accounts, roles, and access."
      />

      {dbError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Database not reachable.
        </div>
      )}

      <AdminManagementClient
        admins={rows}
        currentAdminId={session.adminId}
        nextUserId={nextUserId}
      />
    </div>
  );
}
