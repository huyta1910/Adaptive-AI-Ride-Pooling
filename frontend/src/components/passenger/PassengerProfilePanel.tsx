import { zodResolver } from "@hookform/resolvers/zod";
import { UserRound } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePassengerProfile, useUpdatePassengerProfile } from "@/features/passenger/hooks";
import {
  passengerProfileSchema,
  type PassengerProfileFormValues,
} from "@/features/passenger/validation";

interface PassengerProfilePanelProps {
  passengerId: string;
}

export function PassengerProfilePanel({ passengerId }: PassengerProfilePanelProps) {
  const profile = usePassengerProfile(passengerId);
  const updateProfile = useUpdatePassengerProfile(passengerId);
  const form = useForm<PassengerProfileFormValues>({
    resolver: zodResolver(passengerProfileSchema),
    defaultValues: {
      display_name: "",
    },
  });

  useEffect(() => {
    if (profile.data) {
      form.reset({ display_name: profile.data.display_name });
    }
  }, [form, profile.data]);

  const onSubmit = form.handleSubmit((values) => updateProfile.mutate(values));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="h-5 w-5" aria-hidden="true" />
          Passenger profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        {profile.isLoading ? (
          <div className="grid gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : null}
        {profile.isError ? (
          <p className="text-sm text-destructive">Passenger profile could not be loaded.</p>
        ) : null}
        {profile.data ? (
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Input
              {...form.register("display_name")}
              aria-invalid={Boolean(form.formState.errors.display_name)}
              disabled={updateProfile.isPending}
            />
            {form.formState.errors.display_name ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.display_name.message}
              </p>
            ) : null}
            {updateProfile.isError ? (
              <p className="text-sm text-destructive">Profile could not be updated.</p>
            ) : null}
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving..." : "Save profile"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
