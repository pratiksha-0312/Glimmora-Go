import { requireAccess } from "@/lib/auth";
import { Settings, User, Shield, Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAccess("dashboard");

  const sections = [
    {
      icon: User,
      title: "Account",
      description: "Manage your account details and preferences",
      iconBg: "bg-orange-50",
      iconText: "text-orange-500",
    },
    {
      icon: Shield,
      title: "Security",
      description: "Password, two-factor authentication and sessions",
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure alert preferences and SOS thresholds",
      iconBg: "bg-green-50",
      iconText: "text-green-600",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
          <Settings className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin Settings</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{session.email}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg}`}>
              <s.icon className={`h-5 w-5 ${s.iconText}`} />
            </div>
            <div className="text-sm font-semibold text-slate-900">{s.title}</div>
            <div className="mt-1 text-xs text-slate-500">{s.description}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Profile</h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Full Name</label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                {session.name}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Email</label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                {session.email}
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Role</label>
            <div className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              {session.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
