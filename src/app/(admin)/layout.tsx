import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar role={session.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header name={session.name} email={session.email} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
