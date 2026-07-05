import { z } from "zod";

const addressSchema = z.object({
  houseNumber: z.string().trim().min(1, "House number is required.").max(60),
  street: z.string().trim().min(1, "Street is required.").max(120),
  province: z.string().trim().min(1, "Province or city is required.").max(120),
  ward: z.string().trim().min(1, "Ward, commune, or special zone is required.").max(120),
});

export const rideRequestSchema = z.object({
  pickup_address: addressSchema,
  dropoff_address: addressSchema,
  pickup_label: z.string().min(3, "Pickup must be at least 3 characters.").max(255),
  dropoff_label: z.string().min(3, "Dropoff must be at least 3 characters.").max(255),
  pickup_latitude: z.number().min(-90).max(90).nullable().optional(),
  pickup_longitude: z.number().min(-180).max(180).nullable().optional(),
  dropoff_latitude: z.number().min(-90).max(90).nullable().optional(),
  dropoff_longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const passengerProfileSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters.").max(120),
});

export type RideRequestFormValues = z.infer<typeof rideRequestSchema>;
export type PassengerProfileFormValues = z.infer<typeof passengerProfileSchema>;
