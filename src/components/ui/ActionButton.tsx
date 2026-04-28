import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-[color:var(--brand-500)] text-white hover:bg-[color:var(--brand-600)] disabled:opacity-60",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60",
  danger:
    "border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-60",
};

type CommonProps = {
  variant?: Variant;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
};

type ButtonProps = CommonProps & {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

type LinkProps = CommonProps & {
  href: string;
  type?: never;
  onClick?: never;
  disabled?: never;
};

export function ActionButton(props: ButtonProps | LinkProps) {
  const { variant = "secondary", icon: Icon, children, className } = props;
  const cls = cn(
    "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition",
    VARIANT[variant],
    className
  );
  const inner = (
    <>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </>
  );
  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={cls}
    >
      {inner}
    </button>
  );
}
