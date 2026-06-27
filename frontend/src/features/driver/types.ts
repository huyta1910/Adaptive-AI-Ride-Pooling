export type DriverAvailabilityStatus = "online" | "offline" | "inactive";

export type DriverTripStatus =
  | "assigned"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Driver {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleLabel: string;
  availabilityStatus: DriverAvailabilityStatus;
}

export interface DriverTrip {
  id: string;
  bookingId: string;
  driverId: string | null;
  status: DriverTripStatus;
  totalFare: number | null;
  completedAt: string | null;
  createdAt: string;
}

export interface DriverDashboardStats {
  totalTrips: number;
  completedTrips: number;
  earningsToday: number;
  earningsTotal: number;
}

export interface DriverDashboard {
  driver: Driver;
  stats: DriverDashboardStats;
  activeTrip: DriverTrip | null;
}

export interface UpdateAvailabilityPayload {
  availabilityStatus: DriverAvailabilityStatus;
}
