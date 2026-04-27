import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { requireAccess } from "@/lib/auth";
import { Bell, MessageSquare, Mail, Smartphone } from "lucide-react";
import type {
  NotificationChannel,
  NotificationStatus,
} from "../../../../../generated/prisma";

export const dynamic = "force-dynamic";

const CHANNEL_ICON: Record<NotificationChannel, typeof Bell> = {
  SMS: MessageSquare,
  EMAIL: Mail,
  PUSH: Bell,
  WHATSAPP: Smartphone,
};

function statusVariant(s: NotificationStatus) {
  if (s === "DELIVERED") return "success" as const;
  if (s === "SENT") return "info" as const;
  return "danger" as const;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string; status?: string }>;
}) {
  await requireAccess("notifications");
  const sp = await searchParams;

  let notifications: Awaited<ReturnType<typeof prisma.notification.findMany>> = [];
  let dbError = false;
  try {
    notifications = await prisma.notification.findMany({
      where: {
        ...(sp.channel && ["SMS", "EMAIL", "PUSH", "WHATSAPP"].includes(sp.channel)
          ? { channel: sp.channel as NotificationChannel }
          : {}),
        ...(sp.status && ["SENT", "DELIVERED", "FAILED"].includes(sp.status)
          ? { status: sp.status as NotificationStatus }
          : {}),
      },
      orderBy: { sentAt: "desc" },
      take: 200,
    });
  } catch {
    dbError = true;
  }

  const channels: (NotificationChannel | "ALL")[] = [
    "ALL",
    "SMS",
    "EMAIL",
    "PUSH",
    "WHATSAPP",
  ];
  const statuses: (NotificationStatus | "ALL")[] = [
    "ALL",
    "SENT",
    "DELIVERED",
    "FAILED",
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Configuration" },
          { label: "Notification Logs" },
        ]}
        title="Notification Logs"
        description="Outbound SMS, email, push and WhatsApp messages sent by the platform"
      />

      {dbError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Database not reachable. Run{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
            npm run db:push
          </code>{" "}
          to create the new <code>Notification</code> table.
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">
          Channel:
        </span>
        {channels.map((c) => {
          const active = (sp.channel ?? "ALL") === c;
          const params = new URLSearchParams();
          if (c !== "ALL") params.set("channel", c);
          if (sp.status) params.set("status", sp.status);
          const href = "/configuration/notifications" + (params.toString() ? `?${params}` : "");
          return (
            <a
              key={c}
              href={href}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                active
                  ? "bg-[#a57865] text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-[#fbf7f2]"
              }`}
            >
              {c === "ALL" ? "All" : c}
            </a>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">
          Status:
        </span>
        {statuses.map((s) => {
          const active = (sp.status ?? "ALL") === s;
          const params = new URLSearchParams();
          if (sp.channel) params.set("channel", sp.channel);
          if (s !== "ALL") params.set("status", s);
          const href = "/configuration/notifications" + (params.toString() ? `?${params}` : "");
          return (
            <a
              key={s}
              href={href}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                active
                  ? "bg-[#a57865] text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-[#fbf7f2]"
              }`}
            >
              {s === "ALL" ? "All" : s}
            </a>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#f0e4d6] bg-[#fbf7f2] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Channel</th>
                <th className="px-5 py-3 text-left">Recipient</th>
                <th className="px-5 py-3 text-left">Template</th>
                <th className="px-5 py-3 text-left">Body</th>
                <th className="px-5 py-3 text-left">Context</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-slate-400"
                  >
                    No notifications logged yet. Outbound SMS / push / email events
                    will appear here once any sender writes to the
                    <code className="ml-1 rounded bg-slate-100 px-1 py-0.5 text-xs">
                      Notification
                    </code>{" "}
                    table.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => {
                  const Icon = CHANNEL_ICON[n.channel];
                  return (
                    <tr key={n.id} className="hover:bg-[#fbf7f2]">
                      <td className="px-5 py-3">
                        <div className="inline-flex items-center gap-1.5 text-slate-700">
                          <Icon className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs font-medium">{n.channel}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{n.recipient}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {n.template}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        <span className="line-clamp-1">{n.body}</span>
                      </td>
                      <td className="px-5 py-3 text-[11px] text-slate-400">
                        {n.context ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={statusVariant(n.status)}>{n.status}</Badge>
                        {n.error && (
                          <div className="mt-0.5 truncate text-[10px] text-red-600">
                            {n.error}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatDate(n.sentAt)}
                      </td>
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
