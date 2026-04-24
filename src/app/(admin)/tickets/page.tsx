import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { TicketForm } from "./TicketForm";

export const dynamic = "force-dynamic";

const STATUS_PILLS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

function statusBadge(status: string) {
  if (status === "OPEN") return <Badge variant="warning">Open</Badge>;
  if (status === "IN_PROGRESS") return <Badge variant="info">In progress</Badge>;
  if (status === "RESOLVED") return <Badge variant="success">Resolved</Badge>;
  return <Badge variant="default">Closed</Badge>;
}

function priorityBadge(priority: string) {
  if (priority === "URGENT") return <Badge variant="danger">Urgent</Badge>;
  if (priority === "HIGH") return <Badge variant="warning">High</Badge>;
  if (priority === "LOW") return <Badge variant="default">Low</Badge>;
  return <Badge variant="info">Normal</Badge>;
}

async function getTickets(cityId: string | null, status: string | undefined) {
  try {
    return await prisma.ticket.findMany({
      where: {
        ...(cityId ? { cityId } : {}),
        ...(status ? { status: status as never } : {}),
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        rider: { select: { phone: true, name: true } },
        driver: { select: { phone: true, name: true } },
        city: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireAccess("tickets");
  const canWrite = sessionCanWrite(session, "tickets");
  const { status } = await searchParams;
  const tickets = await getTickets(session.cityId, status);

  const open = tickets.filter((t) => t.status === "OPEN").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Rider / driver complaints and support issues"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Open
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{open}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            In progress
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-700">
            {inProgress}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Total (this view)
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {tickets.length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {canWrite && (
          <div className="lg:col-span-1">
            <TicketForm />
          </div>
        )}

        <div className={canWrite ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="mb-3 flex flex-wrap gap-2">
            {STATUS_PILLS.map((p) => {
              const active = (status ?? "") === p.value;
              const href = p.value ? `/tickets?status=${p.value}` : "/tickets";
              return (
                <Link
                  key={p.value}
                  href={href}
                  className={
                    active
                      ? "rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white"
                      : "rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }
                >
                  {p.label}
                </Link>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Subject</th>
                    <th className="px-5 py-3 text-left">Category</th>
                    <th className="px-5 py-3 text-left">Priority</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Who</th>
                    <th className="px-5 py-3 text-left">Assignee</th>
                    <th className="px-5 py-3 text-left">Opened</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-12 text-center text-sm text-slate-400"
                      >
                        No tickets in this view
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <Link
                            href={`/tickets/${t.id}`}
                            className="font-medium text-slate-900 hover:text-brand-600"
                          >
                            {t.subject}
                          </Link>
                          <div className="text-xs text-slate-500">
                            {t.city?.name ?? "—"}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-700">
                          {t.category.replace(/_/g, " ")}
                        </td>
                        <td className="px-5 py-3">{priorityBadge(t.priority)}</td>
                        <td className="px-5 py-3">{statusBadge(t.status)}</td>
                        <td className="px-5 py-3 text-xs text-slate-600">
                          {t.rider
                            ? `Rider · ${t.rider.name ?? t.rider.phone}`
                            : t.driver
                              ? `Driver · ${t.driver.name}`
                              : "—"}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">
                          {t.assignedTo?.name ?? "Unassigned"}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">
                          {formatDate(t.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
