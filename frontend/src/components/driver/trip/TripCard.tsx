import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TripActions } from "@/components/driver/trip/TripActions";
import { TripStatusBadge } from "@/components/driver/trip/TripStatusBadge";
import { TripStatusStepper } from "@/components/driver/trip/TripStatusStepper";
import { formatDriverCurrency, formatDriverDateTime } from "@/features/driver/format";
import { isActiveTripStatus } from "@/features/driver/tripLifecycle";
import type { DriverTripDetail, DriverTripStatus } from "@/features/driver/types";

interface TripCardProps {
  trip: DriverTripDetail;
  isPending: boolean;
  onAction: (tripId: string, next: DriverTripStatus) => void;
}

export function TripCard({ trip, isPending, onAction }: TripCardProps) {
  const fare = trip.totalFare ?? trip.estimatedFare;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="truncate">{trip.pickupLabel ?? "Pickup"}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{trip.dropoffLabel ?? "Dropoff"}</span>
          </div>
          <TripStatusBadge status={trip.status} />
        </div>

        {isActiveTripStatus(trip.status) || trip.status === "completed" ? (
          <TripStatusStepper status={trip.status} />
        ) : null}

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>
            Fare:{" "}
            <span className="font-medium text-foreground">
              {fare === null ? "—" : formatDriverCurrency(fare)}
            </span>
          </span>
          <span>Requested: {formatDriverDateTime(trip.requestedAt)}</span>
          {trip.completedAt ? (
            <span>Completed: {formatDriverDateTime(trip.completedAt)}</span>
          ) : null}
        </div>

        <TripActions
          status={trip.status}
          isPending={isPending}
          onAction={(next) => onAction(trip.id, next)}
        />
      </CardContent>
    </Card>
  );
}
