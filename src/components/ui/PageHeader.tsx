import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

export function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
  tabs,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: Crumb[];
  tabs?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--brand-text)]">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {action && !tabs && <div>{action}</div>}
      </div>
      {tabs && (
        <div className="mt-4 flex items-center justify-between gap-4 border-b border-slate-200">
          <div className="flex items-center gap-1">{tabs}</div>
          {action && <div className="pb-2">{action}</div>}
        </div>
      )}
    </div>
  );
}
