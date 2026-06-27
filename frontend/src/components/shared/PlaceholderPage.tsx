import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/motion/PageTransition";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ description, title }: PlaceholderPageProps) {
  return (
    <PageTransition>
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
              Placeholder content area
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
