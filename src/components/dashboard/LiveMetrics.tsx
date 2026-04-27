"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, AlertTriangle, Car, Share2 } from "lucide-react";
import { useNotificationStore, type NotificationType } from "@/store/notificationStore";

interface Metric {
  type: NotificationType;
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  redirectUrl: string;
  notificationTitle: string;
  notificationMessage: (v: number) => string;
}

function MetricCard({ metric }: { metric: Metric }) {
  const router = useRouter();
  const add = useNotificationStore((s) => s.addNotification);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    add({
      type: metric.type,
      title: metric.notificationTitle,
      message: metric.notificationMessage(metric.value),
      redirectUrl: metric.redirectUrl,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Icon = metric.icon;

  return (
    <div
      onClick={() => router.push(metric.redirectUrl)}
      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-[#21262d] dark:bg-[#161b27] dark:hover:border-brand-600/40"
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.iconBg}`}
        >
          <Icon className={`h-5 w-5 ${metric.iconColor}`} />
        </div>
        <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
          Live
        </span>
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {metric.value.toLocaleString()}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          {metric.label}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{metric.sub}</p>
      </div>
    </div>
  );
}

export function LiveMetrics({
  signups,
  sosAlerts,
  driversOnline,
  referralSignups,
}: {
  signups: number;
  sosAlerts: number;
  driversOnline: number;
  referralSignups: number;
}) {
  const metrics: Metric[] = [
    {
      type: "signup",
      label: "New Signups",
      value: signups,
      sub: "Riders registered today",
      icon: UserPlus,
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      redirectUrl: "/riders",
      notificationTitle: "New Signup Activity",
      notificationMessage: (v) => `${v} new rider${v !== 1 ? "s" : ""} signed up today.`,
    },
    {
      type: "sos",
      label: "SOS Alerts",
      value: sosAlerts,
      sub: "Active emergencies today",
      icon: AlertTriangle,
      iconBg: "bg-red-50 dark:bg-red-950/40",
      iconColor: "text-red-600 dark:text-red-400",
      redirectUrl: "/sos",
      notificationTitle: "SOS Alert",
      notificationMessage: (v) => `${v} SOS alert${v !== 1 ? "s" : ""} triggered today.`,
    },
    {
      type: "driver",
      label: "Drivers Online",
      value: driversOnline,
      sub: "Currently active",
      icon: Car,
      iconBg: "bg-brand-50 dark:bg-brand-950/40",
      iconColor: "text-brand-600 dark:text-brand-400",
      redirectUrl: "/drivers",
      notificationTitle: "Driver Activity",
      notificationMessage: (v) => `${v} driver${v !== 1 ? "s" : ""} are currently online.`,
    },
    {
      type: "referral",
      label: "Referral Signups",
      value: referralSignups,
      sub: "Via referral links today",
      icon: Share2,
      iconBg: "bg-purple-50 dark:bg-purple-950/40",
      iconColor: "text-purple-600 dark:text-purple-400",
      redirectUrl: "/referrals",
      notificationTitle: "Referral Signup",
      notificationMessage: (v) => `${v} rider${v !== 1 ? "s" : ""} joined via referral today.`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => (
        <MetricCard key={m.type} metric={m} />
      ))}
    </div>
  );
}
