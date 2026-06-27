import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DriverDashboardErrorProps {
  message?: string;
  onRetry: () => void;
}

export function DriverDashboardError({ message, onRetry }: DriverDashboardErrorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Unable to load dashboard</CardTitle>
        <CardDescription>{message ?? "Something went wrong. Please try again."}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
