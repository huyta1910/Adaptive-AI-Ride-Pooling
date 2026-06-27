import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRideHistory } from "@/features/passenger/hooks";
import { StatusPill } from "@/components/passenger/StatusPill";

interface RideHistoryListProps {
  passengerId: string;
}

export function RideHistoryList({ passengerId }: RideHistoryListProps) {
  const rideHistory = useRideHistory(passengerId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" aria-hidden="true" />
          Ride history
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rideHistory.isLoading ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : null}
        {rideHistory.isError ? (
          <p className="text-sm text-destructive">Ride history could not be loaded.</p>
        ) : null}
        {rideHistory.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">Completed rides will appear here.</p>
        ) : null}
        {rideHistory.data?.map((ride) => (
          <div key={ride.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {ride.pickup_label} to {ride.dropoff_label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(ride.requested_at).toLocaleDateString()}
                </p>
              </div>
              <StatusPill status={ride.status} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
