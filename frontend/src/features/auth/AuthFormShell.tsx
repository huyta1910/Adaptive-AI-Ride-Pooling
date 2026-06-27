import type { PropsWithChildren } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthFormShellProps extends PropsWithChildren {
  title: string;
  description: string;
}

export function AuthFormShell({ children, description, title }: AuthFormShellProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-5xl items-center justify-center px-2 py-8">
      <Card className="w-full max-w-md border-white/60 bg-card/90 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
