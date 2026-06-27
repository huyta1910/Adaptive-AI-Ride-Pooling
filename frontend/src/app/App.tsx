import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { AppProviders } from "@/app/providers/AppProviders";
import { router } from "@/routes/router";

export function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}
