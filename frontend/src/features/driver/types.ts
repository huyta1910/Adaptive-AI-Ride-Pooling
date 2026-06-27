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

export interface DriverTripDetail extends DriverTrip {
  pickupLabel: string | null;
  dropoffLabel: string | null;
  requestedAt: string | null;
  estimatedFare: number | null;
}

export interface PaginatedTrips {
  items: DriverTripDetail[];
  page: number;
  pageSize: number;
  total: number;
}

export interface UpdateTripStatusPayload {
  status: DriverTripStatus;
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

// --- Earnings ---

export interface DailyEarning {
  date: string;
  amount: number;
  tripCount: number;
}

export interface EarningsSummary {
  period: "week" | "month";
  total: number;
  tripCount: number;
  averagePerTrip: number;
  daily: DailyEarning[];
}

// --- Pool Suggestions ---

export interface PoolPassenger {
  pickupLabel: string;
  dropoffLabel: string;
  estimatedFare: number | null;
  stopOrder: number;
}

export interface PoolSuggestion {
  id: string;
  status: string;
  originArea: string | null;
  destinationArea: string | null;
  passengers: PoolPassenger[];
  totalEstimatedFare: number;
  createdAt: string;
}

export type PoolAction = "accept" | "decline";

// --- Notifications ---

export type NotificationStatus = "unread" | "read";

export interface DriverNotification {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
}

export interface PaginatedNotifications {
  items: DriverNotification[];
  total: number;
  unreadCount: number;
}

// --- Profile ---

export interface DriverProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleLabel: string;
  availabilityStatus: DriverAvailabilityStatus;
  fullName: string;
  email: string;
}

export interface UpdateProfilePayload {
  vehicleLabel?: string;
  fullName?: string;
}
