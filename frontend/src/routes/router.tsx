import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedLayout } from "@/layouts/ProtectedLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { DriverDashboardPage } from "@/pages/DriverDashboardPage";
import { HomePage } from "@/pages/HomePage";
import { LoadingPage } from "@/pages/LoadingPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { PassengerDashboardPage } from "@/pages/PassengerDashboardPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { TripDetailPage } from "@/pages/TripDetailPage";
import { ROUTES } from "@/routes/constants";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    hydrateFallbackElement: <LoadingPage />,
    children: [
      { path: ROUTES.home, element: <HomePage /> },
      { path: ROUTES.login, element: <LoginPage /> },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: ROUTES.passengerDashboard, element: <PassengerDashboardPage /> },
          { path: ROUTES.driverDashboard, element: <DriverDashboardPage /> },
          { path: ROUTES.tripDetail, element: <TripDetailPage /> },
          { path: ROUTES.notifications, element: <NotificationsPage /> },
          { path: ROUTES.profile, element: <ProfilePage /> },
          { path: "/dashboard", element: <Navigate to={ROUTES.passengerDashboard} replace /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
