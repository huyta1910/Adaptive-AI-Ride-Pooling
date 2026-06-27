import { zodResolver } from "@hookform/resolvers/zod";
import { Car, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormShell } from "@/features/auth/AuthFormShell";
import { getDashboardRoute } from "@/features/auth/authRoutes";
import { useAuth } from "@/features/auth/AuthProvider";
import { DEMO_CREDENTIALS } from "@/features/auth/demoAuthStorage";
import type { SignInValues } from "@/features/auth/types";
import { ROUTES } from "@/routes/constants";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (session) {
      navigate(getDashboardRoute(session), { replace: true });
    }
  }, [navigate, session]);

  function completeSignIn(values: SignInValues) {
    try {
      const nextSession = signIn(values);
      const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(fromPath ?? getDashboardRoute(nextSession), { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  }

  return (
    <AuthFormShell
      title="Sign In"
      description="Use a demo account or sign in with an account created in this browser."
    >
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => completeSignIn(DEMO_CREDENTIALS.passenger)}
        >
          <UserRound className="h-4 w-4" />
          Passenger Demo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => completeSignIn(DEMO_CREDENTIALS.driver)}
        >
          <Car className="h-4 w-4" />
          Driver Demo
        </Button>
      </div>
      <form className="grid gap-4" onSubmit={form.handleSubmit(completeSignIn)}>
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
            autoComplete="current-password"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <Button type="submit" className="w-full">
          Sign In
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Need a demo account?{" "}
          <Link className="font-medium text-primary" to={ROUTES.signup}>
            Sign up
          </Link>
        </p>
      </form>
    </AuthFormShell>
  );
}
