import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
<<<<<<< HEAD
    <div className="flex h-screen bg-[#fbf7f3] font-sans">
      <Sidebar role={session.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header name={session.name} email={session.email} role={session.role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
=======
    <AdminShell name={session.name} role={session.role}>
      {children}
    </AdminShell>
>>>>>>> fff2399 (Dashboard and coupons page UI enhancement)
  );
}
