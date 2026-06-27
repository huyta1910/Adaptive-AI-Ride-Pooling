import { z } from "zod";

export const rideRequestSchema = z.object({
  pickup_label: z.string().min(3, "Pickup must be at least 3 characters.").max(255),
  dropoff_label: z.string().min(3, "Dropoff must be at least 3 characters.").max(255),
});

export const passengerProfileSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters.").max(120),
});

export type RideRequestFormValues = z.infer<typeof rideRequestSchema>;
export type PassengerProfileFormValues = z.infer<typeof passengerProfileSchema>;
