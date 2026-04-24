import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Share2, UserPlus, Gift } from "lucide-react";
import { ReferralRowActions } from "./ReferralRowActions";
import { RecomputeButton } from "./RecomputeButton";
import { requireAccess, sessionCanWrite } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [total, joined, rewarded, topReferrers, recent] = await Promise.all([
      prisma.referral.count(),
      prisma.referral.count({ where: { refereeJoined: true } }),
      prisma.referral.count({ where: { rewardIssued: true } }),
      prisma.driver.findMany({
        orderBy: { referredDrivers: { _count: "desc" } },
        take: 5,
        include: { _count: { select: { referredDrivers: true } } },
      }),
      prisma.referral.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
    return { total, joined, rewarded, topReferrers, recent };
  } catch {
    return {
      total: 0,
      joined: 0,
      rewarded: 0,
      topReferrers: [],
      recent: [],
    };
  }
}

export default async function ReferralsPage() {
  const session = await requireAccess("referrals");
  const canWrite = sessionCanWrite(session, "referrals");
  const { total, joined, rewarded, topReferrers, recent } = await getData();

  return (
    <div>
      <PageHeader
        title="Referrals"
        description="Driver-to-driver referrals and reward tracking"
        action={canWrite ? <RecomputeButton /> : undefined}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total Referrals"
          value={total}
          icon={Share2}
          accent="brand"
        />
        <StatCard
          label="Joined"
          value={joined}
          icon={UserPlus}
          trend={`${
            total > 0 ? Math.round((joined / total) * 100) : 0
          }% conversion`}
          accent="blue"
        />
        <StatCard
          label="Rewards Issued"
          value={rewarded}
          icon={Gift}
          accent="green"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Top Referrers
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {topReferrers.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">
                No referrers yet
              </div>
            ) : (
              topReferrers.map((d, i) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {d.name}
                      </div>
                      <div className="text-xs text-slate-500">{d.phone}</div>
                    </div>
                  </div>
                  <Badge variant="info">
                    {d._count.referredDrivers} referrals
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Recent Referrals
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Referee</th>
                  <th className="px-5 py-3 text-left">Rides</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  {canWrite && (
                    <th className="px-5 py-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canWrite ? 5 : 4}
                      className="px-5 py-8 text-center text-sm text-slate-400"
                    >
                      No referrals yet
                    </td>
                  </tr>
                ) : (
                  recent.map((r) => (
                    <tr key={r.id}>
                      <td className="px-5 py-3 text-slate-900">
                        {r.refereePhone}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {r.ridesCompleted} / 10
                      </td>
                      <td className="px-5 py-3">
                        {r.rewardIssued ? (
                          <Badge variant="success">Rewarded</Badge>
                        ) : r.refereeJoined ? (
                          <Badge variant="info">Joined</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatDate(r.createdAt)}
                      </td>
                      {canWrite && (
                        <td className="px-5 py-3 text-right">
                          <ReferralRowActions
                            id={r.id}
                            rewardIssued={r.rewardIssued}
                            refereeJoined={r.refereeJoined}
                          />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
