import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { PoolSuggestionCard } from "@/components/driver/pool/PoolSuggestionCard";
import { DriverErrorState } from "@/components/driver/DriverErrorState";
import { TripListSkeleton } from "@/components/driver/trip/TripListSkeleton";
import { TripLiveIndicator } from "@/components/driver/trip/TripLiveIndicator";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePoolSuggestions } from "@/features/driver/hooks/usePoolSuggestions";
import { useRespondToPool } from "@/features/driver/hooks/useRespondToPool";

export function DriverPoolPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const driverId = searchParams.get("driverId") ?? session?.user.id;

  const suggestionsQuery = usePoolSuggestions(driverId);
  const respondMutation = useRespondToPool(driverId ?? "");
  const resetResponseError = respondMutation.reset;

  const suggestions = suggestionsQuery.data ?? [];
  const isLive = Boolean(driverId) && !suggestionsQuery.isError;

  useEffect(() => {
    if (respondMutation.isError && suggestionsQuery.dataUpdatedAt > 0) {
      resetResponseError();
    }
  }, [respondMutation.isError, resetResponseError, suggestionsQuery.dataUpdatedAt]);

  const handleAccept = (groupId: string) => {
    respondMutation.mutate(
      { groupId, action: "accept" },
      {
        onSuccess: (acceptedPool) => {
          const suffix = searchParams.get("driverId")
            ? `?driverId=${searchParams.get("driverId")}`
            : "";
          navigate(`/dashboard/driver/pool/${acceptedPool.id}${suffix}`);
        },
        onError: () => {
          void suggestionsQuery.refetch();
        },
      },
    );
  };

  return (
    <PageTransition>
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
              AI Pool Suggestions
            </h1>
            <TripLiveIndicator
              dataUpdatedAt={suggestionsQuery.dataUpdatedAt}
              isLive={isLive}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            AI-matched ride pools during high-demand events. Accept to serve multiple
            passengers in one trip.
          </p>
        </div>

        {respondMutation.isError ? (
          <DriverErrorState
            title="Action failed"
            message={
              respondMutation.error instanceof Error
                ? `${respondMutation.error.message}. This pool may have expired; refresh the suggestions and try the latest card.`
                : undefined
            }
            onRetry={() => {
              respondMutation.reset();
              void suggestionsQuery.refetch();
            }}
          />
        ) : null}

        {!driverId ? (
          <DriverErrorState
            title="Unable to load suggestions"
            message="No signed-in driver found."
            onRetry={() => suggestionsQuery.refetch()}
          />
        ) : suggestionsQuery.isPending ? (
          <TripListSkeleton />
        ) : suggestionsQuery.isError ? (
          <DriverErrorState
            title="Unable to load suggestions"
            message={
              suggestionsQuery.error instanceof Error
                ? suggestionsQuery.error.message
                : undefined
            }
            onRetry={() => suggestionsQuery.refetch()}
          />
        ) : suggestions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No pool suggestions right now. They appear automatically when AI detects
              high-demand events.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {suggestions.map((s) => (
              <PoolSuggestionCard
                key={s.id}
                suggestion={s}
                isPending={respondMutation.isPending}
                onAccept={handleAccept}
                onDecline={(id) =>
                  respondMutation.mutate(
                    { groupId: id, action: "decline" },
                    {
                      onError: () => {
                        void suggestionsQuery.refetch();
                      },
                    },
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
