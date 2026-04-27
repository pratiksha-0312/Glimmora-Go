import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { driverStatusVariant } from "@/lib/format";
import { DriverActions } from "./DriverActions";
import { DocumentActions } from "./DocumentActions";
import { DocumentUpload } from "./DocumentUpload";
import { requireAccess, sessionCanWrite } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAccess("drivers");
  const { id } = await params;
  const driver = await prisma.driver
    .findUnique({
      where: { id },
      include: {
        city: true,
        documents: { orderBy: { uploadedAt: "desc" } },
        _count: { select: { rides: true } },
      },
    })
    .catch(() => null);

  if (!driver) notFound();
  if (session.cityId && driver.cityId !== session.cityId) redirect("/drivers");

  const canManageDriver = sessionCanWrite(session, "drivers");
  const canManageDocs = sessionCanWrite(session, "documents");

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Driver Operations" },
          { label: "Drivers", href: "/drivers" },
          { label: "Driver" },
        ]}
        title={driver.name}
        description={`Driver · ${driver.phone}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              Profile
            </h3>
            <dl className="space-y-2 text-sm">
              <Row label="Status">
                <Badge variant={driverStatusVariant(driver.status)}>
                  {driver.status}
                </Badge>
              </Row>
              <Row label="City">{driver.city?.name ?? "—"}</Row>
              <Row label="Phone">{driver.phone}</Row>
              <Row label="Online">{driver.online ? "Yes" : "No"}</Row>
              <Row label="Daily Goal">₹{driver.dailyGoal}</Row>
              <Row label="Rides">{driver._count.rides}</Row>
              <Row label="Referral">
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                  {driver.referralCode}
                </code>
              </Row>
              <Row label="Joined">{formatDate(driver.createdAt)}</Row>
            </dl>
            {canManageDriver && (
              <DriverActions id={driver.id} status={driver.status} />
            )}
          </div>

          {driver.verificationNote && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="mb-1 font-medium">Verification note</div>
              {driver.verificationNote}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[#f0e4d6] bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Documents
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {driver.documents.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">
                  {canManageDocs
                    ? "No documents uploaded yet. Use the form below."
                    : "No documents uploaded"}
                </div>
              ) : (
                driver.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {doc.type}
                      </div>
                      <div className="text-xs text-slate-500">
                        Uploaded {formatDate(doc.uploadedAt)}
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        View file →
                      </a>
                    </div>
                    {canManageDocs ? (
                      <DocumentActions
                        driverId={driver.id}
                        docId={doc.id}
                        status={doc.status}
                        reviewNote={doc.reviewNote}
                      />
                    ) : (
                      <Badge variant="default">{doc.status}</Badge>
                    )}
                  </div>
                ))
              )}
            </div>
            {canManageDocs && <DocumentUpload driverId={driver.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}
