import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { requireAccess, sessionCanWrite } from "@/lib/auth";
import { TicketActions } from "./TicketActions";

export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  if (status === "OPEN") return <Badge variant="warning">Open</Badge>;
  if (status === "IN_PROGRESS")
    return <Badge variant="info">In progress</Badge>;
  if (status === "RESOLVED") return <Badge variant="success">Resolved</Badge>;
  return <Badge variant="default">Closed</Badge>;
}

export default async function TicketDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAccess("tickets");
  const canWrite = sessionCanWrite(session, "tickets");

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      rider: { select: { id: true, phone: true, name: true } },
      driver: { select: { id: true, phone: true, name: true } },
      ride: {
        select: {
          id: true,
          pickupAddress: true,
          dropAddress: true,
          status: true,
          fareFinal: true,
        },
      },
      city: { select: { name: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
  if (!ticket) notFound();
  if (session.cityId && ticket.cityId && ticket.cityId !== session.cityId) {
    notFound();
  }

  const admins = canWrite
    ? await prisma.admin.findMany({
        where: { active: true },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Tickets", href: "/tickets" },
          { label: "Ticket" },
        ]}
        title={ticket.subject}
        description={`${ticket.category.replace(/_/g, " ")} · ${ticket.city?.name ?? "Unassigned city"}`}
        action={
          <Link
            href="/tickets"
            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            ← All tickets
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {statusBadge(ticket.status)}
              <Badge
                variant={
                  ticket.priority === "URGENT"
                    ? "danger"
                    : ticket.priority === "HIGH"
                      ? "warning"
                      : "info"
                }
              >
                {ticket.priority}
              </Badge>
              <span className="text-xs text-slate-500">
                Opened {formatDate(ticket.createdAt)}
              </span>
              {ticket.resolvedAt && (
                <span className="text-xs text-green-700">
                  Resolved {formatDate(ticket.resolvedAt)}
                </span>
              )}
            </div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Description
            </h4>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {ticket.description}
            </p>
          </div>

          {ticket.resolution && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-800">
                Resolution
              </h4>
              <p className="whitespace-pre-wrap text-sm text-green-900">
                {ticket.resolution}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Parties
            </h4>
            <dl className="space-y-2 text-sm">
              {ticket.rider && (
                <div>
                  <dt className="text-xs text-slate-500">Rider</dt>
                  <dd>
                    <Link
                      href={`/riders`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {ticket.rider.name ?? "—"}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {ticket.rider.phone}
                    </div>
                  </dd>
                </div>
              )}
              {ticket.driver && (
                <div>
                  <dt className="text-xs text-slate-500">Driver</dt>
                  <dd>
                    <Link
                      href={`/drivers/${ticket.driver.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {ticket.driver.name}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {ticket.driver.phone}
                    </div>
                  </dd>
                </div>
              )}
              {ticket.ride && (
                <div>
                  <dt className="text-xs text-slate-500">Ride</dt>
                  <dd>
                    <Link
                      href={`/rides`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {ticket.ride.pickupAddress} → {ticket.ride.dropAddress}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-500">Assignee</dt>
                <dd className="text-sm text-slate-700">
                  {ticket.assignedTo?.name ?? "Unassigned"}
                </dd>
              </div>
            </dl>
          </div>

          {canWrite && (
            <TicketActions
              ticket={{
                id: ticket.id,
                status: ticket.status,
                priority: ticket.priority,
                assignedToId: ticket.assignedToId,
                resolution: ticket.resolution,
              }}
              admins={admins}
            />
          )}
        </div>
      </div>
    </div>
  );
}
