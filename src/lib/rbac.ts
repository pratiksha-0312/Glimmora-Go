import type { AdminRole } from "../../generated/prisma";

export type Surface =
  | "dashboard"
  | "rides"
  | "sos"
  | "drivers"
  | "documents"
  | "riders"
  | "fares"
  | "concessions"
  | "coupons"
  | "cities"
  | "referrals"
  | "reports"
  | "admins"
  | "partners"
  | "subscriptions"
  | "tickets"
  | "audit"
  | "corporates";

type Perm = "read" | "write";

const MATRIX: Record<AdminRole, Partial<Record<Surface, Perm>>> = {
  ADMIN: {
    dashboard: "write",
    rides: "write",
    sos: "read",
    drivers: "write",
    documents: "write",
    riders: "read",
    fares: "write",
    concessions: "write",
    coupons: "write",
    cities: "write",
    referrals: "write",
    reports: "read",
    admins: "write",
    partners: "write",
    subscriptions: "write",
    tickets: "write",
    audit: "read",
    corporates: "write",
  },
};

export function canAccess(role: AdminRole, surface: Surface): boolean {
  return MATRIX[role]?.[surface] !== undefined;
}

export function canWrite(role: AdminRole, surface: Surface): boolean {
  return MATRIX[role]?.[surface] === "write";
}

export function isCityScoped(_role: AdminRole): boolean {
  return false;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: "Admin",
};
