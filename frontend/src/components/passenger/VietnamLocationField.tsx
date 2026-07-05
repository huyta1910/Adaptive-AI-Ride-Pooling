import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableAddressSelect } from "@/components/passenger/SearchableAddressSelect";
import {
  useGeocodeVietnamAddress,
  useNormalizeVietnamLocation,
  useReverseGeocodeDeviceLocation,
  useVietnamProvinceOptions,
  useVietnamWardOptions,
} from "@/features/passenger/hooks";
import type {
  AddressOption,
  DeviceCoordinates,
  PassengerAddressPayload,
  PassengerLocationSuggestion,
  VietnamAdministrativeLocation,
} from "@/features/passenger/types";

interface VietnamLocationFieldProps {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  onAddressChange: (value: PassengerAddressPayload) => void;
  onCoordinatesChange?: (coordinates: DeviceCoordinates | null) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

interface AddressParts {
  houseNumber: string;
  street: string;
  province: string;
  ward: string;
  provinceCode: string | null;
  wardCode: string | null;
}

function emptyAddressParts(): AddressParts {
  return {
    houseNumber: "",
    street: "",
    province: "",
    ward: "",
    provinceCode: null,
    wardCode: null,
  };
}

function composeAddress(parts: AddressParts): string {
  return [parts.houseNumber, parts.street, parts.ward, parts.province]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function toAddressPayload(parts: AddressParts): PassengerAddressPayload {
  return {
    houseNumber: parts.houseNumber.trim(),
    street: parts.street.trim(),
    province: parts.province.trim(),
    ward: parts.ward.trim(),
  };
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function formatAdministrativeLocation(location: VietnamAdministrativeLocation): string {
  return `${location.commune_or_ward}, ${location.province}`;
}

function inferStreetParts(suggestion: PassengerLocationSuggestion): Pick<AddressParts, "houseNumber" | "street"> {
  const firstLine = suggestion.name || suggestion.address.split(",")[0] || "";
  const match = firstLine.trim().match(/^(\d+[a-zA-Z]?[\w/-]*)\s+(.+)$/);

  return {
    houseNumber: match?.[1] ?? "",
    street: match?.[2] ?? firstLine.trim(),
  };
}

function findOptionByName(options: AddressOption[] | undefined, name: string): AddressOption | null {
  const normalizedName = normalizeText(name);
  return (
    options?.find((option) => normalizeText(option.name) === normalizedName) ??
    options?.find((option) => {
      const normalizedOption = normalizeText(option.name);
      return normalizedOption.includes(normalizedName) || normalizedName.includes(normalizedOption);
    }) ??
    null
  );
}

export function VietnamLocationField({
  label,
  icon,
  value,
  onChange,
  onAddressChange,
  onCoordinatesChange,
  disabled = false,
  error,
  placeholder,
}: VietnamLocationFieldProps) {
  const [addressParts, setAddressParts] = useState<AddressParts>(emptyAddressParts);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "allowed" | "blocked">(
    "idle",
  );
  const normalizeLocation = useNormalizeVietnamLocation();
  const geocodeAddress = useGeocodeVietnamAddress();
  const reverseGeocode = useReverseGeocodeDeviceLocation();
  const provinces = useVietnamProvinceOptions();
  const wards = useVietnamWardOptions(addressParts.provinceCode);
  const composedAddress = useMemo(() => composeAddress(addressParts), [addressParts]);
  const isBusy = geocodeAddress.isPending || reverseGeocode.isPending || normalizeLocation.isPending;

  useEffect(() => {
    if (value.length === 0 && composedAddress.length > 0) {
      const nextParts = emptyAddressParts();
      setAddressParts(nextParts);
      onAddressChange(toAddressPayload(nextParts));
    }
  }, [composedAddress.length, onAddressChange, value.length]);

  const commitParts = (nextParts: AddressParts, clearCoordinates = true) => {
    setAddressParts(nextParts);
    if (clearCoordinates) {
      onCoordinatesChange?.(null);
    }
    onChange(composeAddress(nextParts));
    onAddressChange(toAddressPayload(nextParts));
  };

  const updateAddressPart = (key: "houseNumber" | "street", nextValue: string) => {
    commitParts({ ...addressParts, [key]: nextValue });
  };

  const handleProvinceChange = (province: AddressOption | null) => {
    commitParts({
      ...addressParts,
      province: province?.name ?? "",
      provinceCode: province?.code ?? null,
      ward: "",
      wardCode: null,
    });
  };

  const handleWardChange = (ward: AddressOption | null) => {
    commitParts({
      ...addressParts,
      ward: ward?.name ?? "",
      wardCode: ward?.code ?? null,
    });
  };

  const handleNormalize = () => {
    const address = composedAddress || value;
    geocodeAddress.mutate(address, {
      onSuccess: (coordinates) => onCoordinatesChange?.(coordinates),
      onError: () => onCoordinatesChange?.(null),
    });
  };

  const applyAdministrativeLocation = (location: VietnamAdministrativeLocation) => {
    const province = findOptionByName(provinces.data, location.province);
    commitParts({
      ...addressParts,
      province: location.province,
      provinceCode: province?.code ?? addressParts.provinceCode,
      ward: location.commune_or_ward,
      wardCode: location.administrative_code,
    });
  };

  const applyDeviceLocation = (suggestion: PassengerLocationSuggestion) => {
    const streetParts = inferStreetParts(suggestion);
    normalizeLocation.mutate(suggestion.label, {
      onSuccess: (result) => {
        const match = result.matched_location ?? result.alternatives[0] ?? null;
        if (match) {
          const province = findOptionByName(provinces.data, match.province);
          const nextParts = {
            ...addressParts,
            ...streetParts,
            province: match.province,
            provinceCode: province?.code ?? null,
            ward: match.commune_or_ward,
            wardCode: match.administrative_code,
          };
          commitParts(nextParts, false);
        } else {
          commitParts({ ...addressParts, ...streetParts }, false);
        }
      },
      onError: () => commitParts({ ...addressParts, ...streetParts }, false),
    });
    onCoordinatesChange?.({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
  };

  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("blocked");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: DeviceCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        reverseGeocode.mutate(coordinates, {
          onSuccess: (suggestion) => {
            applyDeviceLocation(suggestion);
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

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
        <Input
          value={addressParts.houseNumber}
          onChange={(event) => updateAddressPart("houseNumber", event.target.value)}
          aria-invalid={Boolean(error)}
          placeholder="House no."
          disabled={disabled || isBusy}
          autoComplete="off"
        />
        <Input
          value={addressParts.street}
          onChange={(event) => updateAddressPart("street", event.target.value)}
          aria-invalid={Boolean(error)}
          placeholder={placeholder ?? "Street"}
          disabled={disabled || isBusy}
          autoComplete="off"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SearchableAddressSelect
          label="Tỉnh / Thành phố"
          placeholder="Choose province or city"
          options={provinces.data ?? []}
          value={addressParts.provinceCode ?? ""}
          onChange={handleProvinceChange}
          disabled={disabled || isBusy || provinces.isLoading}
          loading={provinces.isLoading}
          error={Boolean(error)}
        />
        <SearchableAddressSelect
          label="Phường / Xã / Đặc khu"
          placeholder={
            addressParts.provinceCode === null ? "Choose province first" : "Choose ward or commune"
          }
          options={wards.data ?? []}
          value={addressParts.wardCode ?? ""}
          onChange={handleWardChange}
          disabled={disabled || isBusy || addressParts.provinceCode === null || wards.isLoading}
          loading={wards.isLoading}
          error={Boolean(error)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleUseDeviceLocation}
          disabled={disabled || locationStatus === "loading" || reverseGeocode.isPending}
        >
          {locationStatus === "loading" || reverseGeocode.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
          )}
          Choose current location
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleNormalize}
          disabled={disabled || isBusy || (composedAddress || value).length < 3}
        >
          {geocodeAddress.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          Set map point
        </Button>
      </div>
      {locationStatus === "allowed" ? (
        <p className="text-xs text-muted-foreground">Current device location was applied.</p>
      ) : null}
      {locationStatus === "blocked" ? (
        <p className="text-xs text-muted-foreground">
          Device location is unavailable. Enter the address manually.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {provinces.isError ? (
        <p className="text-sm text-destructive">Province list could not be loaded.</p>
      ) : null}
      {wards.isError ? (
        <p className="text-sm text-destructive">Ward list could not be loaded.</p>
      ) : null}
      {geocodeAddress.isError ? (
        <p className="text-sm text-destructive">Map coordinates could not be found.</p>
      ) : null}
      {normalizeLocation.data?.matched_location ? (
        <button
          type="button"
          className="rounded-md border bg-muted/30 p-3 text-left text-xs text-muted-foreground hover:bg-accent"
          onClick={() => applyAdministrativeLocation(normalizeLocation.data.matched_location!)}
          disabled={disabled}
        >
          Use normalized unit: {formatAdministrativeLocation(normalizeLocation.data.matched_location)}
        </button>
      ) : null}
      {geocodeAddress.data ? (
        <p className="text-xs text-muted-foreground">
          Coordinates set from map: {geocodeAddress.data.latitude.toFixed(6)},{" "}
          {geocodeAddress.data.longitude.toFixed(6)}
        </p>
      ) : null}
    </div>
  );
}
