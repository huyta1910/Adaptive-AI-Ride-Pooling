export type UserRole = "passenger" | "driver" | "admin";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
