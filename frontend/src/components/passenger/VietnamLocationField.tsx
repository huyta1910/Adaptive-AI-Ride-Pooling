import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, LocateFixed, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useNormalizeVietnamLocation,
  useVietnamLocationSuggestions,
} from "@/features/passenger/hooks";
import type {
  DeviceCoordinates,
  PassengerLocationSuggestion,
  VietnamAdministrativeLocation,
} from "@/features/passenger/types";
import { cn } from "@/utils/cn";

interface VietnamLocationFieldProps {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

function formatAdministrativeLocation(location: VietnamAdministrativeLocation): string {
  return `${location.commune_or_ward}, ${location.province}`;
}

function formatDistance(distanceMeters: number | null): string {
  if (distanceMeters === null) {
    return "";
  }

  if (distanceMeters < 1_000) {
    return `${distanceMeters} m`;
  }

  return `${(distanceMeters / 1_000).toFixed(1)} km`;
}

export function VietnamLocationField({
  label,
  icon,
  value,
  onChange,
  disabled = false,
  error,
  placeholder,
}: VietnamLocationFieldProps) {
  const [coordinates, setCoordinates] = useState<DeviceCoordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "allowed" | "blocked">(
    "idle",
  );
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const blurTimeoutRef = useRef<number | null>(null);
  const normalizeLocation = useNormalizeVietnamLocation();
  const suggestions = useVietnamLocationSuggestions(debouncedValue, coordinates);
  const candidates =
    normalizeLocation.data?.status === "success" && normalizeLocation.data.matched_location
      ? [normalizeLocation.data.matched_location, ...normalizeLocation.data.alternatives]
      : normalizeLocation.data?.alternatives ?? [];
  const visibleSuggestions = useMemo(
    () => suggestions.data?.slice(0, 6) ?? [],
    [suggestions.data],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [value]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleNormalize = () => {
    normalizeLocation.mutate(value);
  };

  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("blocked");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("allowed");
      },
      () => setLocationStatus("blocked"),
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 8_000,
      },
    );
  };

  const handleSelect = (location: VietnamAdministrativeLocation) => {
    onChange(formatAdministrativeLocation(location));
  };

  const handleSuggestionSelect = (suggestion: PassengerLocationSuggestion) => {
    onChange(suggestion.label);
    setIsSuggestionOpen(false);
    normalizeLocation.mutate(suggestion.label);
  };

  const handleInputBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => setIsSuggestionOpen(false), 150);
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setIsSuggestionOpen(true);
            }}
            onFocus={() => setIsSuggestionOpen(true)}
            onBlur={handleInputBlur}
            aria-invalid={Boolean(error)}
            placeholder={placeholder}
            disabled={disabled || normalizeLocation.isPending}
            autoComplete="off"
          />
          {isSuggestionOpen && value.trim().length >= 2 ? (
            <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
              {suggestions.isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Searching nearby...</div>
              ) : null}
              {suggestions.isError ? (
                <div className="px-3 py-2 text-sm text-destructive">
                  Location suggestions are unavailable.
                </div>
              ) : null}
              {!suggestions.isLoading && !suggestions.isError && visibleSuggestions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No nearby suggestions found.
                </div>
              ) : null}
              {visibleSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="grid w-full gap-1 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium">{suggestion.name}</span>
                    {suggestion.distance_meters !== null ? (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistance(suggestion.distance_meters)}
                      </span>
                    ) : null}
                  </span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {suggestion.address}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleUseDeviceLocation}
          disabled={disabled || locationStatus === "loading"}
          title="Use device location for nearby suggestions"
          aria-label={`Use device location for ${label}`}
        >
          {locationStatus === "loading" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleNormalize}
          disabled={disabled || normalizeLocation.isPending || value.trim().length < 2}
          title="Normalize Vietnam administrative location"
          aria-label={`Normalize ${label}`}
        >
          {normalizeLocation.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
      {locationStatus === "allowed" ? (
        <p className="text-xs text-muted-foreground">Nearby suggestions are using device location.</p>
      ) : null}
      {locationStatus === "blocked" ? (
        <p className="text-xs text-muted-foreground">
          Device location is unavailable. Suggestions still search across Vietnam.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {normalizeLocation.isError ? (
        <p className="text-sm text-destructive">Location normalization service is unavailable.</p>
      ) : null}
      {normalizeLocation.data ? (
        <div className="grid gap-2 rounded-md border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 font-medium capitalize",
                normalizeLocation.data.status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : normalizeLocation.data.status === "ambiguous"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-rose-200 bg-rose-50 text-rose-700",
              )}
            >
              {normalizeLocation.data.status.replace("_", " ")}
            </span>
            <span className="text-muted-foreground">
              Normalized: {normalizeLocation.data.normalized_input || "none"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{normalizeLocation.data.reasoning}</p>
          {candidates.length > 0 ? (
            <div className="grid gap-2">
              {candidates.map((candidate) => (
                <button
                  key={`${candidate.administrative_code}-${candidate.province}`}
                  type="button"
                  className="flex items-start justify-between gap-3 rounded-md border bg-background p-2 text-left text-sm hover:bg-accent"
                  onClick={() => handleSelect(candidate)}
                  disabled={disabled}
                >
                  <span>
                    <span className="block font-medium">{formatAdministrativeLocation(candidate)}</span>
                    <span className="block text-xs text-muted-foreground">
                      Code {candidate.administrative_code}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {Math.round(candidate.confidence * 100)}%
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
