import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { DriverErrorState } from "@/components/driver/DriverErrorState";
import { PoolNavigation } from "@/components/driver/pool/PoolNavigation";
import { TripListSkeleton } from "@/components/driver/trip/TripListSkeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCompletePool } from "@/features/driver/hooks/useCompletePool";
import { usePoolSuggestion } from "@/features/driver/hooks/usePoolSuggestion";

export function DriverPoolNavigatePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const driverId = searchParams.get("driverId") ?? session?.user.id;

  const { data, isPending, isError, error, refetch } = usePoolSuggestion(driverId, groupId);
  const completeMutation = useCompletePool(driverId ?? "");

  const backToPool = () => {
    const suffix = searchParams.get("driverId")
      ? `?driverId=${searchParams.get("driverId")}`
      : "";
    navigate(`/dashboard/driver/pool${suffix}`);
  };

  const handleComplete = () => {
    if (!groupId) return;
    completeMutation.mutate(groupId, { onSuccess: backToPool });
  };

  return (
    <PageTransition>
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={backToPool}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Pools
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
              Dinh tuyen chuyen ghep
            </h1>
            {data ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {data.originArea ?? "-"} to {data.destinationArea ?? "-"} -{" "}
                {data.passengers.length} hanh khach
              </p>
            ) : null}
          </div>
        </div>

        {!driverId || !groupId ? (
          <DriverErrorState
            title="Khong tai duoc chuyen ghep"
            message="Thieu thong tin tai xe hoac chuyen ghep."
            onRetry={() => refetch()}
          />
        ) : isPending ? (
          <TripListSkeleton />
        ) : isError ? (
          <DriverErrorState
            title="Khong tai duoc chuyen ghep"
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : data.stops.length === 0 ? (
          <DriverErrorState
            title="Chuyen ghep chua co lo trinh"
            message="Khong co diem don/tra nao de dinh tuyen."
            onRetry={() => refetch()}
          />
        ) : (
          <PoolNavigation
            suggestion={data}
            onComplete={handleComplete}
            isCompleting={completeMutation.isPending}
            completionError={
              completeMutation.isError
                ? completeMutation.error instanceof Error
                  ? completeMutation.error.message
                  : "Khong the hoan thanh chuyen ghep."
                : undefined
            }
          />
        )}
      </div>
    </PageTransition>
  );
}
