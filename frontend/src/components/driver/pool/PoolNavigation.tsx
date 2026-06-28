import { useMemo, useState } from "react";
import { Check, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapLegend } from "@/components/driver/map/MapLegend";
import { RouteMap, type MapMarker } from "@/components/driver/map/RouteMap";
import { cn } from "@/utils/cn";
import type { GeoPoint, PoolStop, PoolSuggestion } from "@/features/driver/types";

interface PoolNavigationProps {
  suggestion: PoolSuggestion;
  isCompleting?: boolean;
  completionError?: string;
  onComplete: () => void;
}

function stopActionLabel(stop: PoolStop): string {
  return stop.type === "pickup"
    ? `Da den - Don khach ${stop.passengerOrder}`
    : `Da den - Tra khach ${stop.passengerOrder}`;
}

export function PoolNavigation({
  suggestion,
  completionError,
  onComplete,
  isCompleting = false,
}: PoolNavigationProps) {
  const stops = suggestion.stops;
  const [currentIndex, setCurrentIndex] = useState(0);

  const isDone = currentIndex >= stops.length;
  const currentStop = stops[currentIndex] ?? null;

  const driverPos: GeoPoint | null = useMemo(() => {
    if (currentIndex === 0) return suggestion.driverStart ?? stops[0]?.point ?? null;
    return stops[currentIndex - 1]?.point ?? null;
  }, [currentIndex, stops, suggestion.driverStart]);

  const remainingRoute: GeoPoint[] = useMemo(() => {
    const points: GeoPoint[] = [];
    for (let i = currentIndex; i < stops.length; i += 1) {
      points.push(...stops[i].legRoute);
    }
    if (points.length === 0 && driverPos) {
      points.push(driverPos);
      for (let i = currentIndex; i < stops.length; i += 1) {
        const point = stops[i].point;
        if (point) points.push(point);
      }
    }
    return points;
  }, [driverPos, currentIndex, stops]);

  const markers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];
    stops.forEach((stop, index) => {
      if (!stop.point) return;
      const kind = index === currentIndex ? "target" : stop.type;
      list.push({
        position: stop.point,
        kind,
        order: stop.sequence,
        label: `${stop.type === "pickup" ? "Don" : "Tra"} ${stop.passengerOrder}: ${stop.label}`,
      });
    });
    if (driverPos && !isDone) {
      list.push({ position: driverPos, kind: "driver", label: "Vi tri cua ban" });
    }
    return list;
  }, [stops, currentIndex, driverPos, isDone]);

  const advance = () => setCurrentIndex((index) => index + 1);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-2">
        <RouteMap
          markers={markers}
          route={isDone ? suggestion.route : remainingRoute}
          congestionZones={suggestion.congestionZones}
          heightClass="h-[420px]"
        />
        <MapLegend
          items={[
            { color: "#ef4444", label: "Diem den tiep theo" },
            { color: "#10b981", label: "Diem don" },
            { color: "#3b82f6", label: "Diem tra" },
            { color: "#f59e0b", label: "Vi tri cua ban" },
          ]}
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Navigation className="h-4 w-4" />
            Dinh tuyen chuyen ghep
          </div>

          <ol className="flex flex-col gap-2">
            {stops.map((stop, index) => {
              const done = index < currentIndex;
              const active = index === currentIndex;
              return (
                <li
                  key={stop.sequence}
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                    active && "border-red-300 bg-red-50",
                    done && "opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                      done ? "bg-emerald-500" : active ? "bg-red-500" : "bg-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-3 w-3" /> : stop.sequence}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {stop.type === "pickup" ? "Don" : "Tra"} khach {stop.passengerOrder}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {stop.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          {isDone ? (
            <div className="flex flex-col gap-3">
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Da hoan thanh tat ca diem don/tra cua chuyen ghep.
              </p>
              {completionError ? (
                <p className="text-sm text-destructive">{completionError}</p>
              ) : null}
              <Button onClick={onComplete} disabled={isCompleting}>
                {isCompleting ? "Dang hoan thanh..." : "Hoan thanh chuyen ghep"}
              </Button>
            </div>
          ) : (
            <Button onClick={advance}>
              {currentStop ? stopActionLabel(currentStop) : "Tiep tuc"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
