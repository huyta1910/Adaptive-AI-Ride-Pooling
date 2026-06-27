import type { PropsWithChildren } from "react";
import { createContext, useContext, useMemo, useState } from "react";
import {
  getStoredSession,
  signInWithDemoCredentials,
  signOutDemoUser,
  signUpDemoUser,
} from "@/features/auth/demoAuthStorage";
import type { AuthSession, SignInValues, SignUpValues } from "@/features/auth/types";

interface AuthContextValue {
  session: AuthSession | null;
  signIn: (values: SignInValues) => AuthSession;
  signUp: (values: SignUpValues) => AuthSession;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      signIn: (values) => {
        const nextSession = signInWithDemoCredentials(values);
        setSession(nextSession);
        return nextSession;
      },
      signUp: (values) => {
        const nextSession = signUpDemoUser(values);
        setSession(nextSession);
        return nextSession;
      },
      signOut: () => {
        signOutDemoUser();
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
