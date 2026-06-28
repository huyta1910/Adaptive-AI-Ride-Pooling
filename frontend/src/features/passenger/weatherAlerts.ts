import type { PassengerNotification } from "@/features/passenger/types";

const WEATHER_ALERT_KEYWORDS = ["weather", "rain", "storm", "flood", "mua", "thoi tiet", "ngap"];

export function isPassengerWeatherAlertNotification(notification: PassengerNotification) {
  if (notification.category === "weather_alert") {
    return true;
  }

  const searchableText = `${notification.title} ${notification.body}`.toLowerCase();
  return WEATHER_ALERT_KEYWORDS.some((keyword) => searchableText.includes(keyword));
}
