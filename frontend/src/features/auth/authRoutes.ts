import type { AuthSession } from "@/features/auth/types";
import { ROUTES } from "@/routes/constants";

export function getDashboardRoute(session: AuthSession): string {
  return session.user.role === "driver" ? ROUTES.driverDashboard : ROUTES.passengerDashboard;
}
