import type { UserRole } from "@/types/domain";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "admin">;
}

export interface AuthSession {
  user: Omit<DemoUser, "password">;
}

export interface SignInValues {
  email: string;
  password: string;
}

export interface SignUpValues extends SignInValues {
  name: string;
  role: Exclude<UserRole, "admin">;
}
