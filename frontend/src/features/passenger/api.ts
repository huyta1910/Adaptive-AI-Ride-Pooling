import { apiClient } from "@/services/api/client";
import type {
  ApiResponse,
  PassengerDashboard,
  PassengerNotification,
  PassengerProfile,
  PassengerProfilePayload,
  RideHistoryItem,
  RideRequest,
  RideRequestPayload,
  RideStatus,
} from "@/features/passenger/types";

async function unwrap<TData>(request: Promise<{ data: ApiResponse<TData> }>): Promise<TData> {
  const response = await request;
  return response.data.data;
}

export const passengerApi = {
  getDashboard(passengerId: string) {
    return unwrap<PassengerDashboard>(apiClient.get(`/passengers/${passengerId}/dashboard`));
  },
  getProfile(passengerId: string) {
    return unwrap<PassengerProfile>(apiClient.get(`/passengers/${passengerId}/profile`));
  },
  updateProfile(passengerId: string, payload: PassengerProfilePayload) {
    return unwrap<PassengerProfile>(apiClient.patch(`/passengers/${passengerId}/profile`, payload));
  },
  requestRide(passengerId: string, payload: RideRequestPayload) {
    return unwrap<RideRequest>(apiClient.post(`/passengers/${passengerId}/rides`, payload));
  },
  getRideStatus(passengerId: string) {
    return unwrap<RideStatus>(apiClient.get(`/passengers/${passengerId}/rides/status`));
  },
  getRideHistory(passengerId: string) {
    return unwrap<RideHistoryItem[]>(apiClient.get(`/passengers/${passengerId}/rides/history`));
  },
  getNotifications(passengerId: string) {
    return unwrap<PassengerNotification[]>(apiClient.get(`/passengers/${passengerId}/notifications`));
  },
  markNotificationRead(passengerId: string, notificationId: string) {
    return unwrap<PassengerNotification>(
      apiClient.patch(`/passengers/${passengerId}/notifications/${notificationId}/read`),
    );
  },
};
