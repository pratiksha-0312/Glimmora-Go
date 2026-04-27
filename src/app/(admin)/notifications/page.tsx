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
  ];

  return (
    <div>
      <PageHeader
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
      </div>
    </div>
  );
}
