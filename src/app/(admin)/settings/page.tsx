import { PageHeader } from "@/components/ui/PageHeader";
import { requireAccess } from "@/lib/auth";
import { Settings, User, Bell, Shield } from "lucide-react";

export default async function AdminSettingsPage() {
  await requireAccess("dashboard");

  const sections = [
    {
      icon: User,
      title: "Profile",
      description: "Update your name, email, and display preferences.",
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure which alerts you receive and how.",
      iconBg: "bg-brand-50 dark:bg-brand-950/40",
      iconColor: "text-brand-600 dark:text-brand-400",
    },
    {
      icon: Shield,
      title: "Security",
      description: "Change your password and manage active sessions.",
      iconBg: "bg-red-50 dark:bg-red-950/40",
      iconColor: "text-red-600 dark:text-red-400",
    },
    {
      icon: Settings,
      title: "Platform",
      description: "Manage global platform settings and feature flags.",
      iconBg: "bg-slate-100 dark:bg-slate-800",
      iconColor: "text-slate-600 dark:text-slate-400",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admin Settings"
        description="Manage your account preferences and platform configuration"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ icon: Icon, title, description, iconBg, iconColor }) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#21262d] dark:bg-[#161b27]"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
