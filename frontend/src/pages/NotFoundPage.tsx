import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/routes/constants";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>404</CardTitle>
          <CardDescription>The requested page does not exist.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to={ROUTES.home}>Return Home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
