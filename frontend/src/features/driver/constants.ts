export const DRIVER_API = {
  dashboard: (driverId: string) => `/drivers/${driverId}/dashboard`,
  availability: (driverId: string) => `/drivers/${driverId}/availability`,
} as const;

export const driverQueryKeys = {
  all: ["driver"] as const,
  dashboard: (driverId: string) => [...driverQueryKeys.all, "dashboard", driverId] as const,
} as const;
