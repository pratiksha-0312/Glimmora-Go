import { prisma } from "@/lib/db";
import { requireAccess } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { AdminForm } from "./AdminForm";
import { AdminRowActions } from "./AdminRowActions";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        createdAt: true,
      },
    });
    return { admins };
  } catch {
    return { admins: [] };
  }
}

export default async function AdminsPage() {
  const session = await requireAccess("admins");
  const { admins } = await getData();
  const canManage = true;

  return (
    <div>
      <PageHeader
        title="Admins"
        description="Manage admin users."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {canManage && (
          <div className="lg:col-span-1">
            <AdminForm />
          </div>
        )}

        <div className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                All Admins
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Joined</th>
                    {canManage && (
                      <th className="px-5 py-3 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canManage ? 5 : 4}
                        className="px-5 py-10 text-center text-sm text-slate-400"
                      >
                        No admins found
                      </td>
                    </tr>
                  ) : (
                    admins.map((a) => {
                      const isSelf = a.id === session?.adminId;
                      return (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <div className="font-medium text-slate-900">
                              {a.name}
                              {isSelf && (
                                <span className="ml-2 text-xs font-normal text-slate-400">
                                  (you)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-slate-700">
                            {a.email}
                          </td>
                          <td className="px-5 py-3">
                            {a.active ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="default">Disabled</Badge>
                            )}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">
                            {formatDate(a.createdAt)}
                          </td>
                          {canManage && (
                            <td className="px-5 py-3 text-right">
                              {isSelf ? (
                                <span className="text-xs text-slate-400">
                                  —
                                </span>
                              ) : (
                                <AdminRowActions
                                  id={a.id}
                                  active={a.active}
                                />
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
