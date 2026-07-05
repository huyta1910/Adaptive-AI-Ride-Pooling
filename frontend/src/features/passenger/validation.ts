import { z } from "zod";

const addressSchema = z
  .object({
    houseNumber: z.string().trim().max(60).optional().default(""),
    street: z.string().trim().max(120).optional().default(""),
    province: z.string().trim().max(120).optional().default(""),
    ward: z.string().trim().max(120).optional().default(""),
    fullAddress: z.string().trim().max(255).optional().default(""),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    placeId: z.string().trim().optional().default(""),
    type: z.enum(["poi", "address"]).optional(),
  })
  .superRefine((address, context) => {
    const hasCoordinates = address.latitude != null && address.longitude != null;
    const hasSelectedSuggestion = Boolean(address.placeId) || hasCoordinates;
    const hasExactAddress = Boolean(address.houseNumber && address.street);

    if (hasSelectedSuggestion || hasExactAddress) {
      return;
    }

    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["houseNumber"],
      message: "Please enter a house number or choose a specific location.",
    });
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
