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
  | "corporates"
  | "notifications"
  | "tracking";

export type FeatureKey =
  // Operations Dashboard panels
  | "dashboard.live_rides"
  | "dashboard.active_drivers"
  | "dashboard.revenue_snapshot"
  | "dashboard.sos_summary"
  // Ride Operations
  | "rides.live"
  | "rides.scheduled"
  | "rides.history"
  // Driver Operations
  | "drivers.list"
  | "drivers.document_approval"
  | "drivers.subscription_status"
  | "drivers.referrals"
  // Pricing & Promotions
  | "pricing.fare_setup"
  | "pricing.concessions"
  | "pricing.coupons"
  // Safety
  | "safety.sos_alerts"
  | "safety.incident_logs"
  // Partner Management
  | "partners.list"
  | "partners.verification"
  | "partners.commission"
  // Reports
  | "reports.rides"
  | "reports.revenue"
  | "reports.driver_utilization"
  // Configuration
  | "config.city_archetype"
  | "config.roles_permissions"
  | "config.notification_logs";

const SUPER_SET: AdminRole[] = ["SUPER_ADMIN"];

const FEATURES: Record<FeatureKey, AdminRole[]> = {
  // Dashboard
  "dashboard.live_rides": [...SUPER_SET, "OPERATIONS_MANAGER", "FINANCE_ADMIN", "SUPPORT_AGENT"],
  "dashboard.active_drivers": [...SUPER_SET, "OPERATIONS_MANAGER", "SUPPORT_AGENT"],
  "dashboard.revenue_snapshot": [...SUPER_SET, "FINANCE_ADMIN"],
  "dashboard.sos_summary": [...SUPER_SET, "OPERATIONS_MANAGER", "SUPPORT_AGENT"],
  // Ride Operations
  "rides.live": [...SUPER_SET, "OPERATIONS_MANAGER", "SUPPORT_AGENT"],
  "rides.scheduled": [...SUPER_SET, "OPERATIONS_MANAGER"],
  "rides.history": [...SUPER_SET, "OPERATIONS_MANAGER", "SUPPORT_AGENT"],
  // Driver Operations
  "drivers.list": [...SUPER_SET, "OPERATIONS_MANAGER", "SUPPORT_AGENT"],
  "drivers.document_approval": [...SUPER_SET, "OPERATIONS_MANAGER"],
  "drivers.subscription_status": [...SUPER_SET, "OPERATIONS_MANAGER", "FINANCE_ADMIN"],
  "drivers.referrals": [...SUPER_SET, "OPERATIONS_MANAGER", "FINANCE_ADMIN"],
  // Pricing & Promotions
  "pricing.fare_setup": [...SUPER_SET, "FINANCE_ADMIN"],
  "pricing.concessions": [...SUPER_SET, "FINANCE_ADMIN"],
  "pricing.coupons": [...SUPER_SET, "FINANCE_ADMIN"],
  // Safety
  "safety.sos_alerts": [...SUPER_SET, "OPERATIONS_MANAGER", "SUPPORT_AGENT"],
  "safety.incident_logs": [...SUPER_SET, "OPERATIONS_MANAGER", "SUPPORT_AGENT"],
  // Partner / Kirana Management
  "partners.list": [...SUPER_SET, "PARTNER_MANAGER"],
  "partners.verification": [...SUPER_SET, "PARTNER_MANAGER"],
  "partners.commission": [...SUPER_SET, "FINANCE_ADMIN", "PARTNER_MANAGER"],
  // Reports
  "reports.rides": [...SUPER_SET, "OPERATIONS_MANAGER", "FINANCE_ADMIN", "PARTNER_MANAGER"],
  "reports.revenue": [...SUPER_SET, "FINANCE_ADMIN"],
  "reports.driver_utilization": [...SUPER_SET, "OPERATIONS_MANAGER", "FINANCE_ADMIN"],
  // Configuration
  "config.city_archetype": [...SUPER_SET, "FINANCE_ADMIN"],
  "config.roles_permissions": [...SUPER_SET], // Super Admin only per Excel
  "config.notification_logs": [...SUPER_SET, "OPERATIONS_MANAGER", "FINANCE_ADMIN"],
};

// Mapping each feature → which surface it lives on
const FEATURE_SURFACE: Record<FeatureKey, Surface> = {
  "dashboard.live_rides": "dashboard",
  "dashboard.active_drivers": "dashboard",
  "dashboard.revenue_snapshot": "dashboard",
  "dashboard.sos_summary": "dashboard",
  "rides.live": "rides",
  "rides.scheduled": "rides",
  "rides.history": "rides",
  "drivers.list": "drivers",
  "drivers.document_approval": "drivers",
  "drivers.subscription_status": "subscriptions",
  "drivers.referrals": "referrals",
  "pricing.fare_setup": "fares",
  "pricing.concessions": "concessions",
  "pricing.coupons": "coupons",
  "safety.sos_alerts": "sos",
  "safety.incident_logs": "tracking",
  "partners.list": "partners",
  "partners.verification": "partners",
  "partners.commission": "partners",
  "reports.rides": "reports",
  "reports.revenue": "reports",
  "reports.driver_utilization": "reports",
  "config.city_archetype": "cities",
  "config.roles_permissions": "admins",
  "config.notification_logs": "notifications",
};

// Features that imply *write* on their surface (everything else is read-only).
// Inferred from the action they describe (setup, approval, management).
const WRITE_FEATURES: Set<FeatureKey> = new Set<FeatureKey>([
  "drivers.document_approval",
  "pricing.fare_setup",
  "pricing.concessions",
  "pricing.coupons",
  "partners.list",
  "partners.verification",
  "config.city_archetype",
  "config.roles_permissions",
]);

export function canFeature(role: AdminRole, key: FeatureKey): boolean {
  return FEATURES[key].includes(role);
}

export function canAccess(role: AdminRole, surface: Surface): boolean {
  // Dashboard is always reachable for any logged-in admin — panel-level
  // gating decides what they see. Avoids `requireAccess("dashboard")`
  // looping back to `/` for roles like Partner Manager.
  if (surface === "dashboard") return true;
  // Allow if any feature on this surface is granted to the role.
  for (const [key, s] of Object.entries(FEATURE_SURFACE) as [FeatureKey, Surface][]) {
    if (s === surface && canFeature(role, key)) return true;
  }
  // Surfaces with no Excel feature mapping fall back to SUPER_ADMIN-only —
  // covers riders, audit, corporates, tickets which are not in the matrix.
  if (
    surface === "riders" ||
    surface === "audit" ||
    surface === "corporates" ||
    surface === "tickets"
  ) {
    return SUPER_SET.includes(role);
  }
  return false;
}

export function canWrite(role: AdminRole, surface: Surface): boolean {
  for (const [key, s] of Object.entries(FEATURE_SURFACE) as [FeatureKey, Surface][]) {
    if (s === surface && WRITE_FEATURES.has(key) && canFeature(role, key)) {
      return true;
    }
  }
  if (role === "SUPER_ADMIN") {
    // Super-admin writes to anything they can access
    return canAccess(role, surface);
  }
  return false;
}

export function isCityScoped(_role: AdminRole): boolean {
  return false;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  OPERATIONS_MANAGER: "Operations Manager",
  FINANCE_ADMIN: "Finance Admin",
  SUPPORT_AGENT: "Support Agent",
  PARTNER_MANAGER: "Partner Manager",
};

// Re-export the matrix structure for the Roles & Permissions admin page.
export const RBAC_MATRIX_ROWS: {
  module: string;
  feature: string;
  subFeature: string;
  key: FeatureKey;
}[] = [
  { module: "Operations Dashboard", feature: "Dashboard Overview", subFeature: "Live Ride Monitoring", key: "dashboard.live_rides" },
  { module: "Operations Dashboard", feature: "Dashboard Overview", subFeature: "Active Drivers", key: "dashboard.active_drivers" },
  { module: "Operations Dashboard", feature: "Dashboard Overview", subFeature: "Revenue Snapshot", key: "dashboard.revenue_snapshot" },
  { module: "Operations Dashboard", feature: "Dashboard Overview", subFeature: "SOS Alerts Summary", key: "dashboard.sos_summary" },
  { module: "Ride Operations", feature: "Ride Monitoring", subFeature: "Live Rides", key: "rides.live" },
  { module: "Ride Operations", feature: "Ride Scheduling", subFeature: "Scheduled Rides", key: "rides.scheduled" },
  { module: "Ride Operations", feature: "Ride History", subFeature: "Ride Details", key: "rides.history" },
  { module: "Driver Operations", feature: "Driver Management", subFeature: "Driver List", key: "drivers.list" },
  { module: "Driver Operations", feature: "Driver Verification", subFeature: "Document Approval", key: "drivers.document_approval" },
  { module: "Driver Operations", feature: "Driver Earnings", subFeature: "Subscription Status", key: "drivers.subscription_status" },
  { module: "Driver Operations", feature: "Driver Referrals", subFeature: "Referral Tracking", key: "drivers.referrals" },
  { module: "Pricing & Promotions", feature: "Fare Configuration", subFeature: "Base Fare Setup", key: "pricing.fare_setup" },
  { module: "Pricing & Promotions", feature: "Fare Configuration", subFeature: "Concession Pricing", key: "pricing.concessions" },
  { module: "Pricing & Promotions", feature: "Promotions", subFeature: "Coupon Management", key: "pricing.coupons" },
  { module: "Safety Monitoring", feature: "Emergency Alerts", subFeature: "Live SOS Alerts", key: "safety.sos_alerts" },
  { module: "Safety Monitoring", feature: "Incident Logs", subFeature: "Ride Share Tracking", key: "safety.incident_logs" },
  { module: "Partner / Kirana Management", feature: "Partner Management", subFeature: "Partner List", key: "partners.list" },
  { module: "Partner / Kirana Management", feature: "Partner Onboarding", subFeature: "Partner Verification", key: "partners.verification" },
  { module: "Partner / Kirana Management", feature: "Commission Tracking", subFeature: "Partner Commission", key: "partners.commission" },
  { module: "Reports", feature: "Analytics", subFeature: "Ride Reports", key: "reports.rides" },
  { module: "Reports", feature: "Analytics", subFeature: "Revenue Reports", key: "reports.revenue" },
  { module: "Reports", feature: "Analytics", subFeature: "Driver Utilization", key: "reports.driver_utilization" },
  { module: "Configuration", feature: "City Config", subFeature: "City Archetype Config", key: "config.city_archetype" },
  { module: "Configuration", feature: "User Management", subFeature: "Roles & Permissions", key: "config.roles_permissions" },
  { module: "Configuration", feature: "Logs", subFeature: "Notification Logs", key: "config.notification_logs" },
];

export const RBAC_ROLE_COLUMNS: { key: AdminRole; label: string }[] = [
  { key: "SUPER_ADMIN", label: "Super Admin" },
  { key: "OPERATIONS_MANAGER", label: "Ops Manager" },
  { key: "FINANCE_ADMIN", label: "Finance" },
  { key: "SUPPORT_AGENT", label: "Support" },
  { key: "PARTNER_MANAGER", label: "Partner Mgr" },
];
