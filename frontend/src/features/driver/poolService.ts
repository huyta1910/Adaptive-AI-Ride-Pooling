import { apiClient } from "@/services/api/client";
import { DRIVER_API } from "@/features/driver/constants";
import { toNullableNumber, toNumber } from "@/features/driver/mappers";
import type { PoolAction, PoolPassenger, PoolSuggestion } from "@/features/driver/types";

interface RawPoolPassenger {
  pickup_label: string;
  dropoff_label: string;
  estimated_fare: string | number | null;
  stop_order: number;
}

interface RawPoolSuggestion {
  id: string;
  status: string;
  origin_area: string | null;
  destination_area: string | null;
  passengers: RawPoolPassenger[];
  total_estimated_fare: string | number;
  created_at: string;
}

function mapPassenger(raw: RawPoolPassenger): PoolPassenger {
  return {
    pickupLabel: raw.pickup_label,
    dropoffLabel: raw.dropoff_label,
    estimatedFare: toNullableNumber(raw.estimated_fare),
    stopOrder: raw.stop_order,
  };
}

function mapSuggestion(raw: RawPoolSuggestion): PoolSuggestion {
  return {
    id: raw.id,
    status: raw.status,
    originArea: raw.origin_area,
    destinationArea: raw.destination_area,
    passengers: raw.passengers.map(mapPassenger),
    totalEstimatedFare: toNumber(raw.total_estimated_fare),
    createdAt: raw.created_at,
  };
}

export async function getPoolSuggestions(driverId: string): Promise<PoolSuggestion[]> {
  const { data } = await apiClient.get(DRIVER_API.poolSuggestions(driverId));
  return (data.data as RawPoolSuggestion[]).map(mapSuggestion);
}

export async function respondToPool(
  driverId: string,
  groupId: string,
  action: PoolAction,
): Promise<PoolSuggestion> {
  const { data } = await apiClient.patch(DRIVER_API.poolRespond(driverId, groupId), { action });
  return mapSuggestion(data.data as RawPoolSuggestion);
}
