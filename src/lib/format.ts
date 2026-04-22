import type { RideStatus, DriverStatus, DocumentStatus } from "../../generated/prisma";

export function rideStatusVariant(status: RideStatus) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "danger";
    case "IN_TRIP":
    case "EN_ROUTE":
    case "ARRIVED":
      return "info";
    case "MATCHED":
      return "warning";
    case "REQUESTED":
    default:
      return "default";
  }
}

export function driverStatusVariant(status: DriverStatus) {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
    case "SUSPENDED":
      return "danger";
    default:
      return "default";
  }
}

export function docStatusVariant(status: DocumentStatus) {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
      return "danger";
    default:
      return "default";
  }
}
