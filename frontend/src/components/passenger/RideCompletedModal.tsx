import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { usePassengerDashboard, useRideHistory, useRideStatus } from "@/features/passenger/hooks";

interface RideCompletedModalProps {
  passengerId: string;
}

export function RideCompletedModal({ passengerId }: RideCompletedModalProps) {
  const queryClient = useQueryClient();
  const rideStatus = useRideStatus(passengerId);
  const rideHistory = useRideHistory(passengerId);
  const dashboard = usePassengerDashboard(passengerId);
  const refetchRideHistory = rideHistory.refetch;
  const refetchDashboard = dashboard.refetch;
  const previousRideIdRef = useRef<string | null>(null);
  const shownCompletedBookingRef = useRef<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const currentRide = rideStatus.data?.current_ride ?? null;

    if (currentRide) {
      previousRideIdRef.current = currentRide.id;
      return;
    }

    const previousRideId = previousRideIdRef.current;
    if (previousRideId) {
      void refetchRideHistory();
      void refetchDashboard();
    }
  }, [refetchDashboard, refetchRideHistory, rideStatus.data]);

  useEffect(() => {
    const previousRideId = previousRideIdRef.current;
    const latestCompletedRide = rideHistory.data?.find(
      (ride) => ride.booking_id === previousRideId && ride.status === "completed",
    );

    if (
      previousRideId &&
      latestCompletedRide &&
      shownCompletedBookingRef.current !== latestCompletedRide.booking_id
    ) {
      shownCompletedBookingRef.current = latestCompletedRide.booking_id;
      previousRideIdRef.current = null;
      setIsOpen(true);
    }
  }, [rideHistory.data]);

  const handleClose = async () => {
    setIsOpen(false);
    await Promise.all([
      rideStatus.refetch(),
      rideHistory.refetch(),
      dashboard.refetch(),
      queryClient.invalidateQueries({ queryKey: ["passenger", passengerId] }),
    ]);
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          void handleClose();
          return;
        }
        setIsOpen(open);
      }}
      title="Ride Completed"
      description="Your trip has been completed. You can book a new ride now."
    >
      <div className="grid gap-4">
        <div className="flex items-center gap-3 rounded-md border bg-emerald-50 p-3 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          <p className="text-sm font-medium">Thanks for riding with Adaptive AI Ride Pooling.</p>
        </div>
        <Button type="button" onClick={() => void handleClose()}>
          Book another ride
        </Button>
      </div>
    </Modal>
  );
}
