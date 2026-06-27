import type { AuthSession, DemoUser, SignInValues, SignUpValues } from "@/features/auth/types";

const USERS_KEY = "adaptive-demo-users";
const SESSION_KEY = "adaptive-demo-session";

const demoUsers: DemoUser[] = [
  {
    id: "demo-passenger",
    name: "Demo Passenger",
    email: "passenger@demo.local",
    password: "passenger123",
    role: "passenger",
  },
  {
    id: "demo-driver",
    name: "Demo Driver",
    email: "driver@demo.local",
    password: "driver123",
    role: "driver",
  },
];

function readUsers(): DemoUser[] {
  const rawUsers = localStorage.getItem(USERS_KEY);

  if (!rawUsers) {
    localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
    return demoUsers;
  }

  const users = JSON.parse(rawUsers) as DemoUser[];
  const mergedUsers = [
    ...demoUsers,
    ...users.filter((user) => !demoUsers.some((demoUser) => demoUser.email === user.email)),
  ];

  localStorage.setItem(USERS_KEY, JSON.stringify(mergedUsers));
  return mergedUsers;
}

function toSession(user: DemoUser): AuthSession {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export function getStoredSession(): AuthSession | null {
  const rawSession = localStorage.getItem(SESSION_KEY);
  return rawSession ? (JSON.parse(rawSession) as AuthSession) : null;
}

export function signInWithDemoCredentials(values: SignInValues): AuthSession {
  const user = readUsers().find(
    (item) =>
      item.email.toLowerCase() === values.email.toLowerCase() && item.password === values.password,
  );

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const session = toSession(user);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function signUpDemoUser(values: SignUpValues): AuthSession {
  const users = readUsers();
  const emailExists = users.some((user) => user.email.toLowerCase() === values.email.toLowerCase());

  if (emailExists) {
    throw new Error("An account with this email already exists.");
  }

  const user: DemoUser = {
    id: crypto.randomUUID(),
    name: values.name,
    email: values.email,
    password: values.password,
    role: values.role,
  };

  const nextUsers = [...users, user];
  const session = toSession(user);

  localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return session;
}

export function signOutDemoUser(): void {
  localStorage.removeItem(SESSION_KEY);
}

export const DEMO_CREDENTIALS = {
  passenger: {
    email: "passenger@demo.local",
    password: "passenger123",
  },
  driver: {
    email: "driver@demo.local",
    password: "driver123",
  },
} as const;
