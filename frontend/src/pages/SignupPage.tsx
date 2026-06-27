import { zodResolver } from "@hookform/resolvers/zod";
import { Car, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormShell } from "@/features/auth/AuthFormShell";
import { getDashboardRoute } from "@/features/auth/authRoutes";
import { useAuth } from "@/features/auth/AuthProvider";
import type { SignUpValues } from "@/features/auth/types";
import { ROUTES } from "@/routes/constants";
import { cn } from "@/utils/cn";

const signUpSchema = z.object({
  name: z.string().min(2, "Enter a display name."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Use at least 6 characters."),
  role: z.enum(["passenger", "driver"]),
});

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "passenger",
    },
  });

  const selectedRole = form.watch("role");

  function onSubmit(values: SignUpValues) {
    try {
      const session = signUp(values);
      navigate(getDashboardRoute(session), { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create account.");
    }
  }

  return (
    <AuthFormShell
      title="Create Demo Account"
      description="Choose a passenger or driver profile for the demo."
    >
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="name">
            Name
          </label>
          <Input id="name" autoComplete="name" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email ? (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["passenger", "driver"] as const).map((role) => {
            const Icon = role === "driver" ? Car : UserRound;
            return (
              <button
                key={role}
                type="button"
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors",
                  selectedRole === role
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-input bg-background hover:bg-accent",
                )}
                onClick={() => form.setValue("role", role)}
              >
                <Icon className="h-4 w-4" />
                {role === "driver" ? "Driver" : "Passenger"}
              </button>
            );
          })}
        </div>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <Button type="submit" className="w-full">
          Create Account
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-primary" to={ROUTES.login}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthFormShell>
  );
}
