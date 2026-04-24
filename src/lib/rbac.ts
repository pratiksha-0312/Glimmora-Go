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
  SUPER_ADMIN: {
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
    partners: "write",
    subscriptions: "write",
    tickets: "write",
    audit: "read",
    corporates: "write",
  },
  CITY_ADMIN: {
    dashboard: "read",
    rides: "write",
    sos: "read",
    drivers: "write",
    documents: "write",
    riders: "read",
    fares: "write",
    reports: "read",
    partners: "write",
    tickets: "write",
  },
  VERIFIER: {
    drivers: "read",
    documents: "write",
  },
  SUPPORT: {
    dashboard: "read",
    rides: "read",
    sos: "read",
    riders: "read",
    reports: "read",
    tickets: "write",
  },
  VIEWER: {
    dashboard: "read",
    rides: "read",
    sos: "read",
    drivers: "read",
    riders: "read",
    fares: "read",
    concessions: "read",
    coupons: "read",
    cities: "read",
    referrals: "read",
    reports: "read",
    partners: "read",
    subscriptions: "read",
    tickets: "read",
    audit: "read",
    corporates: "read",
  },
};

export function canAccess(role: AdminRole, surface: Surface): boolean {
  return MATRIX[role]?.[surface] !== undefined;
}

export function canWrite(role: AdminRole, surface: Surface): boolean {
  return MATRIX[role]?.[surface] === "write";
}

export function isCityScoped(role: AdminRole): boolean {
  return role === "CITY_ADMIN";
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  CITY_ADMIN: "City Admin",
  VERIFIER: "Verifier",
  SUPPORT: "Support",
  VIEWER: "Viewer",
};
