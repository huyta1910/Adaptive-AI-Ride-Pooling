import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Navigation } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressAutocomplete } from "@/components/passenger/AddressAutocomplete";
import { useRequestRide } from "@/features/passenger/hooks";
import type { PassengerResolvedLocation } from "@/features/passenger/types";
import {
  rideRequestSchema,
  type RideRequestFormValues,
} from "@/features/passenger/validation";

const emptyAddress = {
  houseNumber: "",
  street: "",
  province: "",
  ward: "",
  fullAddress: "",
  latitude: null,
  longitude: null,
  placeId: "",
  type: undefined,
};

interface RideRequestFormProps {
  passengerId: string;
  disabled?: boolean;
}

export function RideRequestForm({ passengerId, disabled = false }: RideRequestFormProps) {
  const requestRide = useRequestRide(passengerId);
  const form = useForm<RideRequestFormValues>({
    resolver: zodResolver(rideRequestSchema),
    defaultValues: {
      pickup_address: emptyAddress,
      dropoff_address: emptyAddress,
      pickup_label: "",
      dropoff_label: "",
      pickup_latitude: null,
      pickup_longitude: null,
      dropoff_latitude: null,
      dropoff_longitude: null,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await requestRide.mutateAsync(values);
    form.reset();
  });

  const applyLocation = (
    prefix: "pickup" | "dropoff",
    location: PassengerResolvedLocation,
  ) => {
    form.setValue(`${prefix}_label`, location.fullAddress, { shouldValidate: true });
    form.setValue(
      `${prefix}_address`,
      {
        houseNumber: location.houseNumber,
        street: location.street,
        province: location.province,
        ward: location.ward,
        fullAddress: location.fullAddress,
        latitude: location.latitude,
        longitude: location.longitude,
        placeId: location.placeId,
        type: location.type,
      },
      { shouldValidate: true },
    );
    form.setValue(`${prefix}_latitude`, location.latitude, { shouldValidate: true });
    form.setValue(`${prefix}_longitude`, location.longitude, { shouldValidate: true });
  };

  const updateLocationText = (prefix: "pickup" | "dropoff", value: string) => {
    form.setValue(`${prefix}_label`, value, { shouldValidate: true });
    form.setValue(`${prefix}_address`, emptyAddress, { shouldValidate: true });
    form.setValue(`${prefix}_latitude`, null, { shouldValidate: true });
    form.setValue(`${prefix}_longitude`, null, { shouldValidate: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a ride</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <AddressAutocomplete
              label="Pickup"
              icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
              value={form.watch("pickup_label")}
              onChange={(value) => updateLocationText("pickup", value)}
              onSelect={(location) => applyLocation("pickup", location)}
              placeholder="Enter pickup address..."
              disabled={disabled || requestRide.isPending}
              required
              error={
                form.formState.errors.pickup_label?.message ??
                form.formState.errors.pickup_address?.houseNumber?.message ??
                form.formState.errors.pickup_address?.street?.message ??
                form.formState.errors.pickup_address?.province?.message ??
                form.formState.errors.pickup_address?.ward?.message
              }
            />
          </div>
          <div className="grid gap-2">
            <AddressAutocomplete
              label="Dropoff"
              icon={<Navigation className="h-4 w-4" aria-hidden="true" />}
              value={form.watch("dropoff_label")}
              onChange={(value) => updateLocationText("dropoff", value)}
              onSelect={(location) => applyLocation("dropoff", location)}
              placeholder="Enter destination address..."
              disabled={disabled || requestRide.isPending}
              required
              error={
                form.formState.errors.dropoff_label?.message ??
                form.formState.errors.dropoff_address?.houseNumber?.message ??
                form.formState.errors.dropoff_address?.street?.message ??
                form.formState.errors.dropoff_address?.province?.message ??
                form.formState.errors.dropoff_address?.ward?.message
              }
            />
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
