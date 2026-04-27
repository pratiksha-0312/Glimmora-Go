<<<<<<< HEAD
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { requireAccess } from "@/lib/auth";
import { Bell, MessageSquare, Mail, Smartphone } from "lucide-react";
import type {
  NotificationChannel,
  NotificationStatus,
} from "../../../../generated/prisma";

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
=======
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, AlertTriangle, Car, Share2, Bell, Trash2, CheckCheck } from "lucide-react";
import { useNotificationStore, type AppNotification, type NotificationType } from "@/store/notificationStore";
import { PageHeader } from "@/components/ui/PageHeader";

type Filter = "all" | "unread";

const TYPE_META: Record<NotificationType, {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
}> = {
  signup: {
    icon: UserPlus,
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    label: "New Signup",
  },
  sos: {
    icon: AlertTriangle,
    iconBg: "bg-red-50 dark:bg-red-950/40",
    iconColor: "text-red-600 dark:text-red-400",
    label: "SOS Alert",
  },
  driver: {
    icon: Car,
    iconBg: "bg-brand-50 dark:bg-brand-950/40",
    iconColor: "text-brand-600 dark:text-brand-400",
    label: "Driver Activity",
  },
  referral: {
    icon: Share2,
    iconBg: "bg-purple-50 dark:bg-purple-950/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    label: "Referral",
  },
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationRow({ n }: { n: AppNotification }) {
  const router = useRouter();
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const meta = TYPE_META[n.type];
  const Icon = meta.icon;

  function handleClick() {
    markAsRead(n.id);
    router.push(n.redirectUrl);
  }

  return (
    <div
      onClick={handleClick}
      className={`flex cursor-pointer items-start gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-[#1c2230] ${
        !n.read ? "bg-brand-50/40 dark:bg-brand-950/10" : ""
      }`}
    >
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconBg}`}>
        <Icon className={`h-4 w-4 ${meta.iconColor}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium ${n.read ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-slate-100"}`}>
            {n.title}
          </p>
          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
            {timeAgo(n.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
          {n.message}
        </p>
        <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.iconBg} ${meta.iconColor}`}>
          {meta.label}
        </span>
      </div>

      {!n.read && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
      )}
    </div>
  );
}

export default function NotificationCentrePage() {
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotificationStore();
  const [filter, setFilter] = useState<Filter>("all");

  const visible = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const TABS: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
>>>>>>> fff2399 (Dashboard and coupons page UI enhancement)
  ];

  return (
    <div>
      <PageHeader
<<<<<<< HEAD
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
          const href = "/notifications" + (params.toString() ? `?${params}` : "");
          return (
            <a
              key={c}
              href={href}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                active
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
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
          const href = "/notifications" + (params.toString() ? `?${params}` : "");
          return (
            <a
              key={s}
              href={href}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                active
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {s === "ALL" ? "All" : s}
            </a>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
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
                    <tr key={n.id} className="hover:bg-slate-50">
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
=======
        title="Notification Centre"
        description="Activity alerts across signups, SOS, drivers, and referrals"
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-[#21262d] dark:bg-[#161b27]">

        {/* ── Top bar: filters left, actions right ── */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 dark:border-[#21262d]">

          {/* Filter tabs */}
          <div className="flex items-center gap-1 py-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  filter === tab.key
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                      filter === tab.key
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {/* Active underline */}
                {filter === tab.key && (
                  <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-brand-500" />
                )}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-[#30363d] dark:text-slate-400 dark:hover:bg-[#21262d]"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => { clearAll(); setFilter("all"); }}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* ── Notification list ── */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400 dark:text-slate-500">
            <Bell className="h-8 w-8 opacity-30" />
            <p className="text-sm">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
            {filter === "unread" && notifications.length > 0 && (
              <button
                onClick={() => setFilter("all")}
                className="mt-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#21262d]">
            {visible.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </div>
        )}
>>>>>>> fff2399 (Dashboard and coupons page UI enhancement)
      </div>
    </div>
  );
}
