import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { NewSubscriptionButton } from "./NewSubscriptionButton";
import { SubscriptionRowActions } from "./SubscriptionRowActions";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [subs, drivers] = await Promise.all([
      prisma.subscription.findMany({
        orderBy: { startedAt: "desc" },
        take: 200,
        include: {
          driver: {
            select: { id: true, name: true, phone: true, cityId: true },
          },
        },
      }),
      prisma.driver.findMany({
        where: { status: "APPROVED" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, phone: true },
      }),
    ]);
    return { subs, drivers };
  } catch {
    return { subs: [], drivers: [] };
  }
}

export default async function SubscriptionsPage() {
  const session = await requireAccess("subscriptions");
  const canWrite = sessionCanWrite(session, "subscriptions");
  const { subs, drivers } = await getData();

  const now = new Date();
  const activeCount = subs.filter(
    (s) => s.active && s.expiresAt > now
  ).length;
  const revenue = subs.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Driver Operations" },
          { label: "Subscriptions" },
        ]}
        title="Subscriptions"
        description="Grant and track driver sachet plans (daily / weekly / monthly)"
        action={canWrite ? <NewSubscriptionButton drivers={drivers} /> : undefined}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#f0e4d6] bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Active now
          </div>
          <div className="mt-1 text-2xl font-bold text-[#3a2d28]">
            {activeCount}
          </div>
        </div>
        <div className="rounded-xl border border-[#f0e4d6] bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Total granted
          </div>
          <div className="mt-1 text-2xl font-bold text-[#3a2d28]">
            {subs.length}
          </div>
        </div>
        <div className="rounded-xl border border-[#f0e4d6] bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Lifetime revenue
          </div>
          <div className="mt-1 text-2xl font-bold text-[#3a2d28]">
            {formatCurrency(revenue)}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
        <div className="border-b border-[#f0e4d6] px-5 py-4">
          <h3 className="text-sm font-semibold text-[#3a2d28]">
            All subscriptions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#f0e4d6] bg-[#fbf7f2] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Driver</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Started</th>
                <th className="px-5 py-3 text-left">Expires</th>
                <th className="px-5 py-3 text-left">Status</th>
                {canWrite && (
                  <th className="px-5 py-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subs.length === 0 ? (
                <tr>
                  <td
                    colSpan={canWrite ? 7 : 6}
                    className="px-5 py-10 text-center text-sm text-slate-400"
                  >
                    No subscriptions yet
                    {canWrite ? '. Click "New Subscription" to grant one.' : "."}
                  </td>
                </tr>
              ) : (
                subs.map((s) => {
                  const expired = s.expiresAt < now;
                  return (
                    <tr key={s.id} className="hover:bg-[#fbf7f2]">
                      <td className="px-5 py-3">
                        <div className="font-medium text-[#3a2d28]">
                          {s.driver.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {s.driver.phone}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{s.plan}</td>
                      <td className="px-5 py-3 font-medium text-[#3a2d28]">
                        {formatCurrency(s.amount)}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatDate(s.startedAt)}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatDate(s.expiresAt)}
                      </td>
                      <td className="px-5 py-3">
                        {!s.active ? (
                          <Badge variant="default">Revoked</Badge>
                        ) : expired ? (
                          <Badge variant="danger">Expired</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      {canWrite && (
                        <td className="px-5 py-3 text-right">
                          <SubscriptionRowActions
                            id={s.id}
                            active={s.active}
                          />
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
  );
}
