import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { ROUTES } from "@/routes/constants";

export function ProtectedLayout() {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
