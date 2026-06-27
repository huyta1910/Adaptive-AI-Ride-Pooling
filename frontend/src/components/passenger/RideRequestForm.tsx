import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Navigation } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRequestRide } from "@/features/passenger/hooks";
import {
  rideRequestSchema,
  type RideRequestFormValues,
} from "@/features/passenger/validation";

interface RideRequestFormProps {
  passengerId: string;
  disabled?: boolean;
}

export function RideRequestForm({ passengerId, disabled = false }: RideRequestFormProps) {
  const requestRide = useRequestRide(passengerId);
  const form = useForm<RideRequestFormValues>({
    resolver: zodResolver(rideRequestSchema),
    defaultValues: {
      pickup_label: "",
      dropoff_label: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await requestRide.mutateAsync(values);
    form.reset();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a ride</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Pickup
            </div>
            <Input
              {...form.register("pickup_label")}
              aria-invalid={Boolean(form.formState.errors.pickup_label)}
              placeholder="Current location or pickup area"
              disabled={disabled || requestRide.isPending}
            />
            {form.formState.errors.pickup_label ? (
              <p className="text-sm text-destructive">{form.formState.errors.pickup_label.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Navigation className="h-4 w-4" aria-hidden="true" />
              Dropoff
            </div>
            <Input
              {...form.register("dropoff_label")}
              aria-invalid={Boolean(form.formState.errors.dropoff_label)}
              placeholder="Destination"
              disabled={disabled || requestRide.isPending}
            />
            {form.formState.errors.dropoff_label ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.dropoff_label.message}
              </p>
            ) : null}
          </div>
          {requestRide.isError ? (
            <p className="text-sm text-destructive">Ride request could not be created.</p>
          ) : null}
          <Button type="submit" disabled={disabled || requestRide.isPending}>
            {requestRide.isPending ? "Requesting..." : "Find pooled ride"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
