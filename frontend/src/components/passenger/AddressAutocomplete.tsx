import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDebouncedVietnamLocationSuggestions,
  useNormalizeVietnamLocation,
  useReverseGeocodeDeviceLocation,
} from "@/features/passenger/hooks";
import type {
  DeviceCoordinates,
  PassengerLocationSuggestion,
  PassengerResolvedLocation,
  VietnamAdministrativeLocation,
} from "@/features/passenger/types";
import { cn } from "@/utils/cn";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: PassengerResolvedLocation) => void;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  icon?: ReactNode;
  error?: string;
}

type LocationStatus = "idle" | "loading" | "allowed" | "blocked";

function composeFullAddress(location: Pick<PassengerResolvedLocation, "houseNumber" | "street" | "ward" | "province">) {
  return [location.houseNumber, location.street, location.ward, location.province]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function extractStreetParts(input: string, suggestion?: PassengerLocationSuggestion) {
  const primaryText = suggestion?.name || input.split(",")[0] || input;
  const typedMatch = input.trim().match(/^(\d+[a-zA-Z]?[\w/-]*|[A-Z]?\d+[A-Z]?\d*)\s+(.+)$/i);
  const suggestionMatch = primaryText.trim().match(/^(\d+[a-zA-Z]?[\w/-]*|[A-Z]?\d+[A-Z]?\d*)\s+(.+)$/i);
  const match = typedMatch ?? suggestionMatch;

  return {
    houseNumber: match?.[1] ?? "",
    street: match?.[2] ?? primaryText.trim(),
  };
}

function toResolvedLocation(
  input: string,
  suggestion: PassengerLocationSuggestion,
  administrativeLocation: VietnamAdministrativeLocation | null,
): PassengerResolvedLocation {
  const streetParts = extractStreetParts(input, suggestion);
  const isExactAddress = Boolean(streetParts.houseNumber && streetParts.street);
  const locationType: PassengerResolvedLocation["type"] = isExactAddress ? "address" : "poi";
  const baseLocation = {
    fullAddress: suggestion.label,
    houseNumber: streetParts.houseNumber,
    street: streetParts.street,
    ward: administrativeLocation?.commune_or_ward ?? "",
    province: administrativeLocation?.province ?? "",
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
    placeId: suggestion.id,
    type: locationType,
  };
  const structuredAddress = composeFullAddress(baseLocation);

  return {
    ...baseLocation,
    fullAddress:
      administrativeLocation || isExactAddress ? structuredAddress || suggestion.label : suggestion.label,
  };
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter address...",
  defaultValue,
  disabled = false,
  required = false,
  label,
  icon,
  error,
}: AddressAutocompleteProps) {
  const listboxId = useMemo(() => `address-listbox-${Math.random().toString(36).slice(2)}`, []);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState(defaultValue ?? value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [deviceCoordinates, setDeviceCoordinates] = useState<DeviceCoordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const suggestions = useDebouncedVietnamLocationSuggestions(query, deviceCoordinates);
  const normalizeLocation = useNormalizeVietnamLocation();
  const reverseGeocode = useReverseGeocodeDeviceLocation();
  const visibleSuggestions = suggestions.data ?? [];
  const isLoading = suggestions.isFetching || normalizeLocation.isPending || reverseGeocode.isPending;

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const selectSuggestion = (suggestion: PassengerLocationSuggestion, sourceInput = query) => {
    setVerificationError(null);
    normalizeLocation.mutate(suggestion.label, {
      onSuccess: (result) => {
        const administrativeLocation = result.matched_location ?? result.alternatives[0] ?? null;
        const resolvedLocation = toResolvedLocation(sourceInput, suggestion, administrativeLocation);
        setQuery(resolvedLocation.fullAddress);
        onChange(resolvedLocation.fullAddress);
        onSelect(resolvedLocation);
        setIsOpen(false);
      },
      onError: () => {
        const resolvedLocation = toResolvedLocation(sourceInput, suggestion, null);
        setQuery(resolvedLocation.fullAddress);
        onChange(resolvedLocation.fullAddress);
        onSelect(resolvedLocation);
        setIsOpen(false);
      },
    });
  };

  const verifyManualEntry = () => {
    if (visibleSuggestions[highlightedIndex]) {
      selectSuggestion(visibleSuggestions[highlightedIndex], query);
      return;
    }

    if (visibleSuggestions[0]) {
      selectSuggestion(visibleSuggestions[0], query);
      return;
    }

    setVerificationError(
      "We couldn't verify this address. Please select one of the suggested locations or refine your address.",
    );
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("blocked");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setDeviceCoordinates(coordinates);
        reverseGeocode.mutate(coordinates, {
          onSuccess: (suggestion) => {
            selectSuggestion(suggestion, suggestion.name);
            setLocationStatus("allowed");
          },
          onError: () => setLocationStatus("blocked"),
        });
      },
      () => setLocationStatus("blocked"),
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 8_000,
      },
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((current) => Math.min(current + 1, Math.max(visibleSuggestions.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      verifyManualEntry();
    } else if (event.key === "Escape") {
      setIsOpen(false);
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  };

  return (
    <div className="grid gap-2">
      {label ? (
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </div>
      ) : null}
      <div className="relative">
        <div
          className={cn(
            "flex min-h-12 items-center gap-2 rounded-lg border border-input bg-background px-3 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring",
            error && "border-destructive focus-within:ring-destructive",
          )}
        >
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlightedIndex(0);
              setIsOpen(true);
              setVerificationError(null);
              onChange(event.target.value);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-invalid={Boolean(error)}
            autoComplete="off"
          />
          {isLoading ? (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" />
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleCurrentLocation}
            disabled={disabled || locationStatus === "loading"}
            aria-label="Use current location"
          >
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {isOpen && !disabled && query.trim().length >= 2 ? (
          <div
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 z-30 mt-2 max-h-80 overflow-y-auto rounded-lg border bg-popover p-1 shadow-xl"
          >
            {suggestions.isFetching ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">Searching locations...</p>
            ) : null}
            {visibleSuggestions.slice(0, 7).map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                role="option"
                aria-selected={index === highlightedIndex}
                className={cn(
                  "grid min-h-16 w-full gap-1 rounded-md px-3 py-3 text-left hover:bg-accent",
                  index === highlightedIndex && "bg-accent text-accent-foreground",
                )}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                <span className="truncate text-sm font-medium">{suggestion.name}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {suggestion.address}
                  {suggestion.distance_meters !== null
                    ? ` · ${(suggestion.distance_meters / 1000).toFixed(1)} km`
                    : ""}
                </span>
              </button>
            ))}
            {!suggestions.isFetching && visibleSuggestions.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">No matching locations found.</p>
            ) : null}
          </div>
        ) : null}
      </div>
      {verificationError ? <p className="text-sm text-destructive">{verificationError}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {locationStatus === "blocked" ? (
        <p className="text-xs text-muted-foreground">
          Location permission was denied. You can still type and select an address.
        </p>
      ) : null}
      {locationStatus === "allowed" ? (
        <p className="text-xs text-muted-foreground">Current location was applied.</p>
      ) : null}
    </div>
  );
}
